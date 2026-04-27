export const TILE_COLORS = [
  "slate",
  "blue",
  "amber",
  "rose",
  "emerald",
  "violet",
  "cyan",
  "orange",
] as const;

export type TileColor = (typeof TILE_COLORS)[number];

const COLOR_MAP: Record<string, { accent: string; bg: string; badge: string; hex: string; hexLight: string; hexDark: string }> = {
  slate:   { accent: "bg-slate-500",   bg: "bg-slate-500/10",   badge: "bg-slate-500/20 text-slate-300",   hex: "#64748b", hexLight: "#94a3b8", hexDark: "#334155" },
  blue:    { accent: "bg-blue-500",    bg: "bg-blue-500/10",    badge: "bg-blue-500/20 text-blue-300",     hex: "#3b82f6", hexLight: "#60a5fa", hexDark: "#1e40af" },
  amber:   { accent: "bg-amber-500",   bg: "bg-amber-500/10",   badge: "bg-amber-500/20 text-amber-300",   hex: "#f59e0b", hexLight: "#fbbf24", hexDark: "#92400e" },
  rose:    { accent: "bg-rose-500",    bg: "bg-rose-500/10",    badge: "bg-rose-500/20 text-rose-300",     hex: "#f43f5e", hexLight: "#fb7185", hexDark: "#9f1239" },
  emerald: { accent: "bg-emerald-500", bg: "bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-300", hex: "#10b981", hexLight: "#34d399", hexDark: "#065f46" },
  violet:  { accent: "bg-violet-500",  bg: "bg-violet-500/10",  badge: "bg-violet-500/20 text-violet-300",  hex: "#8b5cf6", hexLight: "#a78bfa", hexDark: "#4c1d95" },
  cyan:    { accent: "bg-cyan-500",    bg: "bg-cyan-500/10",    badge: "bg-cyan-500/20 text-cyan-300",     hex: "#06b6d4", hexLight: "#22d3ee", hexDark: "#164e63" },
  orange:  { accent: "bg-orange-500",  bg: "bg-orange-500/10",  badge: "bg-orange-500/20 text-orange-300",  hex: "#f97316", hexLight: "#fb923c", hexDark: "#9a3412" },
};

export function getTileColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.slate;
}
