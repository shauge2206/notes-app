"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import type { Tile, FocusZone } from "@/lib/types";
import { TileCard } from "@/components/tile-card";
import { NewTileDialog } from "@/components/new-tile-dialog";
import { getTileColor } from "@/lib/tile-colors";

interface Props {
  tiles: Tile[];
  zones: FocusZone[];
  previews: Record<
    string,
    | { type: "checklist"; remaining: number; total: number }
    | { type: "sections"; text: string }
  >;
  groupByZone?: boolean;
}

export function TileGrid({ tiles, zones, previews, groupByZone = true }: Props) {
  const zoneMap = new Map(zones.map((z) => [z.id, z]));

  if (!groupByZone) {
    const activeZone = tiles[0]?.zone_id ? zoneMap.get(tiles[0].zone_id) : undefined;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
          {tiles.map((tile, i) => {
            const preview = previews[tile.id];
            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="group/tile"
              >
                <TileCard
                  tile={tile}
                  checklistPreview={
                    preview?.type === "checklist"
                      ? { remaining: preview.remaining, total: preview.total }
                      : undefined
                  }
                  sectionPreview={
                    preview?.type === "sections" ? preview.text : undefined
                  }
                />
              </motion.div>
            );
          })}
          <NewTileButton zones={zones} defaultZoneId={activeZone?.id} />
        </div>
      </div>
    );
  }

  // Group tiles by zone
  const grouped: { zone: FocusZone | null; tiles: Tile[] }[] = [];
  const zoneOrder = zones.map((z) => z.id);
  const byZone = new Map<string | null, Tile[]>();

  for (const tile of tiles) {
    const key = tile.zone_id;
    if (!byZone.has(key)) byZone.set(key, []);
    byZone.get(key)!.push(tile);
  }

  // Include all zones, even empty ones
  for (const zoneId of zoneOrder) {
    grouped.push({
      zone: zoneMap.get(zoneId) ?? null,
      tiles: byZone.get(zoneId) ?? [],
    });
  }

  // Unzoned tiles at the end
  const unzoned = byZone.get(null);
  if (unzoned?.length) {
    grouped.push({ zone: null, tiles: unzoned });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {grouped.map(({ zone, tiles: zoneTiles }, gi) => {
        const color = zone ? getTileColor(zone.color) : null;
        return (
          <div key={zone?.id ?? "unzoned"}>
            <div className="flex items-center gap-2 mb-3">
              {color && (
                <div className={`w-2.5 h-2.5 rounded-full ${color.accent}`} />
              )}
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {zone?.name ?? "Uten zone"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
              {zoneTiles.map((tile, i) => {
                const preview = previews[tile.id];
                return (
                  <motion.div
                    key={tile.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: (gi * 4 + i) * 0.02 }}
                    className="group/tile"
                  >
                    <TileCard
                      tile={tile}
                      checklistPreview={
                        preview?.type === "checklist"
                          ? { remaining: preview.remaining, total: preview.total }
                          : undefined
                      }
                      sectionPreview={
                        preview?.type === "sections" ? preview.text : undefined
                      }
                    />
                  </motion.div>
                );
              })}
              <NewTileButton zones={zones} defaultZoneId={zone?.id} />
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function NewTileButton({ zones, defaultZoneId }: { zones: FocusZone[]; defaultZoneId?: string }) {
  return (
    <div className="h-full">
      <NewTileDialog zones={zones} defaultZoneId={defaultZoneId} trigger={
        <div className="w-full h-full min-h-[140px] rounded-lg border border-dashed border-border/40 hover:border-border/80 hover:bg-accent/20 flex flex-col items-center justify-center gap-2.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-all cursor-pointer">
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">Ny tile</span>
        </div>
      } />
    </div>
  );
}
