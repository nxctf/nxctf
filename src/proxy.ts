import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAINTENANCE_MODE } from "./const";

type MaintenanceType = "manual" | "database" | null;

class MaintenanceState {
  constructor(
    public isActive: boolean,
    public type: MaintenanceType,
    public message: string,
  ) {}

  static inactive() {
    return new MaintenanceState(false, null, "");
  }

  static manual() {
    return new MaintenanceState(
      true,
      "manual",
      "Manual maintenance mode enabled",
    );
  }

  static database(message: string) {
    return new MaintenanceState(true, "database", message);
  }
}

class MaintenanceCache {
  private state: MaintenanceState = MaintenanceState.inactive();
  private lastCheck = 0;

  constructor(private ttl: number) {}

  isValid() {
    return Date.now() - this.lastCheck < this.ttl;
  }

  get() {
    return this.state;
  }

  set(state: MaintenanceState) {
    this.state = state;
    this.lastCheck = Date.now();
  }
}

class DatabaseHealthChecker {
  constructor(private client: SupabaseClient) {}

  async check(): Promise<MaintenanceState> {
    try {
      const { error } = await this.client
        .from("keep-alive")
        .select("id")
        .limit(1);

      const parsed = this.parseError(error);

      if (!parsed.isConnectionError) {
        return MaintenanceState.inactive();
      }

      return MaintenanceState.database(parsed.message);
    } catch (err) {
      const message =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : "Unknown database exception";

      return MaintenanceState.database(message);
    }
  }

  private parseError(error: any) {
    if (!error) return { isConnectionError: false, message: "" };

    const code = error.code || "";
    const message = error.message || "";
    const details = error.details || "";
    const hint = error.hint || "";

    const ignorable =
      code === "42501" || message.toLowerCase().includes("permission denied");

    if (ignorable) {
      return { isConnectionError: false, message: "" };
    }

    const isConnectionError =
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("Failed to fetch") ||
      message.includes("TypeError") ||
      code === "PGRST301" ||
      code === "PGRST204";

    if (!isConnectionError) {
      return { isConnectionError: false, message: "" };
    }

    let formatted = code ? `[${code}] ${message}` : message;

    if (details && !details.includes("fetch failed")) {
      formatted += ` | ${details.slice(0, 100)}`;
    }

    if (hint) {
      formatted += ` | ${hint}`;
    }

    return { isConnectionError, message: formatted };
  }
}

class MaintenanceService {
  constructor(
    private cache: MaintenanceCache,
    private dbChecker: DatabaseHealthChecker,
  ) {}

  async getState(): Promise<MaintenanceState> {
    if (MAINTENANCE_MODE === "yes") {
      return MaintenanceState.manual();
    }

    if (this.cache.isValid()) {
      return this.cache.get();
    }

    const state = await this.dbChecker.check();
    this.cache.set(state);

    return state;
  }
}

class ProxyHandler {
  constructor(private service: MaintenanceService) {}

  async handle(request: NextRequest) {
    const state = await this.service.getState();
    const url = request.nextUrl.clone();

    if (state.isActive) {
      return this.handleMaintenance(url, state);
    }

    return this.handleNormal(request, url);
  }

  private handleMaintenance(url: URL, state: MaintenanceState) {
    if (url.pathname === "/maintenance") {
      const res = NextResponse.next();
      res.headers.set("x-pathname", url.pathname);
      return res;
    }

    url.pathname = "/maintenance";
    url.search = "";

    const res = NextResponse.redirect(url);
    this.setCookies(res, state);

    return res;
  }

  private handleNormal(request: NextRequest, url: URL) {
    if (url.pathname === "/maintenance") {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.cookies.delete("maintenance-type");
      res.cookies.delete("maintenance-error");
      return res;
    }

    const res = NextResponse.next();
    res.headers.set("x-pathname", url.pathname);
    return res;
  }

  private setCookies(res: NextResponse, state: MaintenanceState) {
    res.cookies.set("maintenance-type", state.type || "unknown", {
      path: "/",
      maxAge: 60 * 5,
      sameSite: "lax",
    });

    res.cookies.set(
      "maintenance-error",
      encodeURIComponent(state.message).slice(0, 4000),
      {
        path: "/",
        maxAge: 60 * 5,
        sameSite: "lax",
      },
    );
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const cache = new MaintenanceCache(30_000);
const dbChecker = new DatabaseHealthChecker(supabase);
const service = new MaintenanceService(cache, dbChecker);
const handler = new ProxyHandler(service);

export async function proxy(request: NextRequest) {
  return handler.handle(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
