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

const COLOR_MAP: Record<string, { accent: string; bg: string; badge: string }> = {
  slate:   { accent: "bg-slate-500",   bg: "bg-slate-500/10",   badge: "bg-slate-500/20 text-slate-300" },
  blue:    { accent: "bg-blue-500",    bg: "bg-blue-500/10",    badge: "bg-blue-500/20 text-blue-300" },
  amber:   { accent: "bg-amber-500",   bg: "bg-amber-500/10",   badge: "bg-amber-500/20 text-amber-300" },
  rose:    { accent: "bg-rose-500",    bg: "bg-rose-500/10",    badge: "bg-rose-500/20 text-rose-300" },
  emerald: { accent: "bg-emerald-500", bg: "bg-emerald-500/10", badge: "bg-emerald-500/20 text-emerald-300" },
  violet:  { accent: "bg-violet-500",  bg: "bg-violet-500/10",  badge: "bg-violet-500/20 text-violet-300" },
  cyan:    { accent: "bg-cyan-500",    bg: "bg-cyan-500/10",    badge: "bg-cyan-500/20 text-cyan-300" },
  orange:  { accent: "bg-orange-500",  bg: "bg-orange-500/10",  badge: "bg-orange-500/20 text-orange-300" },
};

export function getTileColor(color: string) {
  return COLOR_MAP[color] ?? COLOR_MAP.slate;
}
