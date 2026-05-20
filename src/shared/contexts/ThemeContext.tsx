"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import { getThemeSetting, setThemeSetting } from "@/shared/lib/settings";

export type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

function ThemeSync() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (didHydrateRef.current) return;

    const nextThemesStored = window.localStorage.getItem("nxctf_theme");
    const legacyTheme = getThemeSetting();

    if (!nextThemesStored && (legacyTheme === "light" || legacyTheme === "dark")) {
      setTheme(legacyTheme);
    }

    didHydrateRef.current = true;
  }, [setTheme]);

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setThemeSetting(resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="nxctf_theme"
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}

export function useTheme(): ThemeContextValue {
  const { resolvedTheme, setTheme } = useNextTheme();

  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  return useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
}
