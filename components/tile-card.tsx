"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pin, CheckSquare, Layers, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TileContextMenu } from "@/components/tile-context-menu";
import { getTileColor } from "@/lib/tile-colors";
import type { Tile } from "@/lib/types";

interface TileCardProps {
  tile: Tile;
  checklistPreview?: { remaining: number; total: number };
  sectionPreview?: string;
  zoneName?: string;
  allTags?: string[];
}

export const TileCard = memo(function TileCard({ tile, checklistPreview, sectionPreview, zoneName, allTags }: TileCardProps) {
  const color = getTileColor(tile.color);

  return (
    <motion.div
      layoutId={`tile-${tile.id}`}
      whileHover={{ scale: 1.015, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.15 }}
    >
      <Link href={`/tile/${tile.id}`} aria-label={`Åpne ${tile.title}`}>
      <div
        className="animate-border-rotate rounded-xl h-full"
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          backgroundImage: `
            linear-gradient(var(--background), var(--background)),
            conic-gradient(
              from var(--gradient-angle, 0deg),
              transparent 0%,
              ${color.hexDark}40 20%,
              ${color.hex}60 30%,
              ${color.hexLight}80 35%,
              ${color.hex}60 40%,
              transparent 50%,
              transparent 100%
            )
          `,
          backgroundClip: "padding-box, border-box",
          backgroundOrigin: "padding-box, border-box",
        }}
      >
      <Card
        className="relative overflow-hidden cursor-pointer h-full flex flex-col border-0 group/tile"
      >
        {/* Color accent strip with animated shimmer */}
        <div
          className="h-2.5 animate-shimmer"
          style={{
            backgroundImage: `linear-gradient(90deg, ${color.hex} 0%, ${color.hexLight} 25%, ${color.hex} 50%, ${color.hexLight} 75%, ${color.hex} 100%)`,
          }}
        />

        <div className="flex flex-col gap-2 p-4 flex-1">
          {/* Header row */}
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
              {tile.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {tile.is_pinned && (
                <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              )}
              {tile.type === "checklist" ? (
                <CheckSquare className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <TileContextMenu tile={tile} allTags={allTags}>
                <div
                  className="w-6 h-6 opacity-0 group-hover/tile:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-accent cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </div>
              </TileContextMenu>
            </div>
          </div>

          {/* Preview */}
          <div className="text-xs text-muted-foreground line-clamp-3 flex-1">
            {tile.type === "checklist" && checklistPreview ? (
              `${checklistPreview.remaining} av ${checklistPreview.total} gjenstår`
            ) : sectionPreview?.startsWith("Neste steg:") ? (
              <>
                <span
                  className="font-bold text-[10px] uppercase tracking-wider mr-1.5 px-1 py-0.5 rounded"
                  style={{ color: color.hex, backgroundColor: `${color.hex}18` }}
                >
                  Neste steg
                </span>
                <span className="text-foreground/70">{sectionPreview.slice(12)}</span>
              </>
            ) : (
              sectionPreview || "Ingen innhold ennå"
            )}
          </div>

          {/* Zone label */}
          {zoneName && (
            <div className="mt-auto">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${color.badge}`}>
                {zoneName}
              </span>
            </div>
          )}
        </div>
      </Card>
      </div>
      </Link>
    </motion.div>
  );
});
