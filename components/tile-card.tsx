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
      <Card
        className="relative overflow-hidden cursor-pointer h-full flex flex-col border-border/50 hover:border-border transition-colors group/tile"
      >
        {/* Color accent strip */}
        <div className={`h-1.5 ${color.accent}`} />

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
          <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
            {tile.type === "checklist" && checklistPreview
              ? `${checklistPreview.remaining} av ${checklistPreview.total} gjenstår`
              : sectionPreview || "Ingen innhold ennå"}
          </p>

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
      </Link>
    </motion.div>
  );
});
