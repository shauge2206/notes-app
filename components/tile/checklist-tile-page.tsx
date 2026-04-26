"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Pin, PinOff, Trash2, MoreHorizontal, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { updateTile, deleteTile, togglePinned } from "@/app/actions/tiles";
import { TILE_COLORS, getTileColor } from "@/lib/tile-colors";
import { AnimatedChecklist } from "@/components/tile/animated-checklist";
import type { TileWithChildren } from "@/lib/types";

interface Props {
  tile: TileWithChildren;
}

export function ChecklistTilePage({ tile }: Props) {
  const [title, setTitle] = useState(tile.title);
  const [isPinned, setIsPinned] = useState(tile.is_pinned);
  const [color, setColor] = useState(tile.color);
  const titleRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const tileColor = getTileColor(color);

  const total = tile.checklist_items.length;
  const done = tile.checklist_items.filter((i) => i.is_completed).length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  async function handleTitleBlur() {
    if (title.trim() && title !== tile.title) {
      const result = await updateTile(tile.id, { title: title.trim() });
      if (!result.ok) toast.error(result.error);
    }
  }

  async function handlePin() {
    setIsPinned((p) => !p);
    const result = await togglePinned(tile.id);
    if (!result.ok) {
      setIsPinned((p) => !p);
      toast.error(result.error);
    }
  }

  async function handleColorChange(c: string) {
    setColor(c);
    const result = await updateTile(tile.id, { color: c });
    if (!result.ok) toast.error(result.error);
  }

  async function handleDelete() {
    const result = await deleteTile(tile.id);
    if (result.ok) {
      router.push("/");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <Input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") titleRef.current?.blur();
          }}
          className="border-none bg-transparent text-lg font-semibold h-auto p-0 focus-visible:ring-0 shadow-none"
        />

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Button variant="ghost" size="icon" onClick={handlePin}>
            {isPinned ? (
              <Pin className="w-4 h-4 text-amber-400 fill-amber-400" />
            ) : (
              <PinOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 hover:bg-accent transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="w-4 h-4 mr-2" />
                  Farge
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <div className="flex gap-1.5 p-2">
                    {TILE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className={`w-6 h-6 rounded-full ${getTileColor(c).accent} ${
                          color === c ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                        } transition-transform hover:scale-110`}
                      />
                    ))}
                  </div>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Slett tile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[640px] mx-auto px-6 py-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Fremgang</span>
              <span className="text-sm font-medium">
                {done} / {total}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${tileColor.accent}`}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Checklist */}
          <AnimatedChecklist
            tileId={tile.id}
            items={tile.checklist_items}
            accentColor={tileColor.accent}
          />
        </div>
      </div>
    </div>
  );
}
