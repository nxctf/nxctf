export type ThemeColor = {
  name: string;
  dot: string;
  iconBg: string;
  iconText: string;
  iconTextDark: string;
  ring: string;
};

// Colors ordered as a smooth spectrum: red → orange → yellow → green → teal → blue → indigo → violet → purple → pink → neutral
// All class variants are written as full string literals so Tailwind includes them at build time.
export const THEME_COLORS: ThemeColor[] = [
  // ── Reds ───────────────────────────────────────────────────────────────────
  {
    name: "red-700",
    dot: "bg-red-700",
    iconBg: "bg-red-700/10",
    iconText: "text-red-700",
    iconTextDark: "dark:text-red-500",
    ring: "ring-red-700/20",
  },
  {
    name: "red",
    dot: "bg-red-500",
    iconBg: "bg-red-500/10",
    iconText: "text-red-500",
    iconTextDark: "dark:text-red-400",
    ring: "ring-red-500/20",
  },
  {
    name: "rose",
    dot: "bg-rose-500",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-500",
    iconTextDark: "dark:text-rose-400",
    ring: "ring-rose-500/20",
  },
  {
    name: "rose-400",
    dot: "bg-rose-400",
    iconBg: "bg-rose-400/10",
    iconText: "text-rose-400",
    iconTextDark: "dark:text-rose-300",
    ring: "ring-rose-400/20",
  },
  // ── Oranges ────────────────────────────────────────────────────────────────
  {
    name: "orange",
    dot: "bg-orange-500",
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-500",
    iconTextDark: "dark:text-orange-400",
    ring: "ring-orange-500/20",
  },
  {
    name: "orange-400",
    dot: "bg-orange-400",
    iconBg: "bg-orange-400/10",
    iconText: "text-orange-400",
    iconTextDark: "dark:text-orange-300",
    ring: "ring-orange-400/20",
  },
  {
    name: "amber",
    dot: "bg-amber-500",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-500",
    iconTextDark: "dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
  {
    name: "amber-300",
    dot: "bg-amber-300",
    iconBg: "bg-amber-300/10",
    iconText: "text-amber-500",
    iconTextDark: "dark:text-amber-300",
    ring: "ring-amber-300/20",
  },
  {
    name: "yellow",
    dot: "bg-yellow-400",
    iconBg: "bg-yellow-400/10",
    iconText: "text-yellow-500",
    iconTextDark: "dark:text-yellow-400",
    ring: "ring-yellow-400/20",
  },
  // ── Greens ─────────────────────────────────────────────────────────────────
  {
    name: "lime-400",
    dot: "bg-lime-400",
    iconBg: "bg-lime-400/10",
    iconText: "text-lime-600",
    iconTextDark: "dark:text-lime-300",
    ring: "ring-lime-400/20",
  },
  {
    name: "lime",
    dot: "bg-lime-500",
    iconBg: "bg-lime-500/10",
    iconText: "text-lime-600",
    iconTextDark: "dark:text-lime-400",
    ring: "ring-lime-500/20",
  },
  {
    name: "green",
    dot: "bg-green-500",
    iconBg: "bg-green-500/10",
    iconText: "text-green-600",
    iconTextDark: "dark:text-green-400",
    ring: "ring-green-500/20",
  },
  {
    name: "green-700",
    dot: "bg-green-700",
    iconBg: "bg-green-700/10",
    iconText: "text-green-700",
    iconTextDark: "dark:text-green-500",
    ring: "ring-green-700/20",
  },
  {
    name: "emerald",
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600",
    iconTextDark: "dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  // ── Teals / Cyans ──────────────────────────────────────────────────────────
  {
    name: "teal-400",
    dot: "bg-teal-400",
    iconBg: "bg-teal-400/10",
    iconText: "text-teal-600",
    iconTextDark: "dark:text-teal-300",
    ring: "ring-teal-400/20",
  },
  {
    name: "teal",
    dot: "bg-teal-500",
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600",
    iconTextDark: "dark:text-teal-400",
    ring: "ring-teal-500/20",
  },
  {
    name: "cyan",
    dot: "bg-cyan-500",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-600",
    iconTextDark: "dark:text-cyan-400",
    ring: "ring-cyan-500/20",
  },
  // ── Blues ──────────────────────────────────────────────────────────────────
  {
    name: "sky",
    dot: "bg-sky-400",
    iconBg: "bg-sky-400/10",
    iconText: "text-sky-400",
    iconTextDark: "dark:text-sky-300",
    ring: "ring-sky-400/20",
  },
  {
    name: "sky-600",
    dot: "bg-sky-600",
    iconBg: "bg-sky-600/10",
    iconText: "text-sky-600",
    iconTextDark: "dark:text-sky-400",
    ring: "ring-sky-600/20",
  },
  {
    name: "blue",
    dot: "bg-blue-500",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-500",
    iconTextDark: "dark:text-blue-400",
    ring: "ring-blue-500/20",
  },
  {
    name: "blue-700",
    dot: "bg-blue-700",
    iconBg: "bg-blue-700/10",
    iconText: "text-blue-700",
    iconTextDark: "dark:text-blue-500",
    ring: "ring-blue-700/20",
  },
  // ── Indigos / Violets ──────────────────────────────────────────────────────
  {
    name: "indigo-400",
    dot: "bg-indigo-400",
    iconBg: "bg-indigo-400/10",
    iconText: "text-indigo-400",
    iconTextDark: "dark:text-indigo-300",
    ring: "ring-indigo-400/20",
  },
  {
    name: "indigo",
    dot: "bg-indigo-500",
    iconBg: "bg-indigo-500/10",
    iconText: "text-indigo-500",
    iconTextDark: "dark:text-indigo-400",
    ring: "ring-indigo-500/20",
  },
  {
    name: "violet",
    dot: "bg-violet-500",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-500",
    iconTextDark: "dark:text-violet-400",
    ring: "ring-violet-500/20",
  },
  {
    name: "violet-700",
    dot: "bg-violet-700",
    iconBg: "bg-violet-700/10",
    iconText: "text-violet-700",
    iconTextDark: "dark:text-violet-500",
    ring: "ring-violet-700/20",
  },
  // ── Purples / Pinks ────────────────────────────────────────────────────────
  {
    name: "purple-700",
    dot: "bg-purple-700",
    iconBg: "bg-purple-700/10",
    iconText: "text-purple-700",
    iconTextDark: "dark:text-purple-500",
    ring: "ring-purple-700/20",
  },
  {
    name: "purple",
    dot: "bg-purple-500",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-500",
    iconTextDark: "dark:text-purple-400",
    ring: "ring-purple-500/20",
  },
  {
    name: "fuchsia",
    dot: "bg-fuchsia-500",
    iconBg: "bg-fuchsia-500/10",
    iconText: "text-fuchsia-500",
    iconTextDark: "dark:text-fuchsia-400",
    ring: "ring-fuchsia-500/20",
  },
  {
    name: "pink-400",
    dot: "bg-pink-400",
    iconBg: "bg-pink-400/10",
    iconText: "text-pink-400",
    iconTextDark: "dark:text-pink-300",
    ring: "ring-pink-400/20",
  },
  {
    name: "pink",
    dot: "bg-pink-500",
    iconBg: "bg-pink-500/10",
    iconText: "text-pink-500",
    iconTextDark: "dark:text-pink-400",
    ring: "ring-pink-500/20",
  },
  // ── Neutrals ───────────────────────────────────────────────────────────────
  {
    name: "slate-700",
    dot: "bg-slate-700",
    iconBg: "bg-slate-700/10",
    iconText: "text-slate-700",
    iconTextDark: "dark:text-slate-400",
    ring: "ring-slate-700/20",
  },
  {
    name: "slate",
    dot: "bg-slate-500",
    iconBg: "bg-slate-500/10",
    iconText: "text-slate-500",
    iconTextDark: "dark:text-slate-400",
    ring: "ring-slate-500/20",
  },
  {
    name: "gray",
    dot: "bg-gray-500",
    iconBg: "bg-gray-500/10",
    iconText: "text-gray-500",
    iconTextDark: "dark:text-gray-400",
    ring: "ring-gray-500/20",
  },
  {
    name: "zinc",
    dot: "bg-zinc-500",
    iconBg: "bg-zinc-500/10",
    iconText: "text-zinc-500",
    iconTextDark: "dark:text-zinc-400",
    ring: "ring-zinc-500/20",
  },
  {
    name: "neutral",
    dot: "bg-neutral-500",
    iconBg: "bg-neutral-500/10",
    iconText: "text-neutral-500",
    iconTextDark: "dark:text-neutral-400",
    ring: "ring-neutral-500/20",
  },
  {
    name: "stone",
    dot: "bg-stone-500",
    iconBg: "bg-stone-500/10",
    iconText: "text-stone-500",
    iconTextDark: "dark:text-stone-400",
    ring: "ring-stone-500/20",
  },
];

const COLOR_LOOKUP = new Map(THEME_COLORS.map((c) => [c.name, c]));
const DEFAULT_COLOR = THEME_COLORS.find((c) => c.name === "blue")!;

export function getColorClasses(color: string): ThemeColor {
  return COLOR_LOOKUP.get(color) ?? DEFAULT_COLOR;
}
