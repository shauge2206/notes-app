"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pin, PinOff, Palette, Trash2, Pencil } from "lucide-react";
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
import { deleteTile, togglePinned, updateTile } from "@/app/actions/tiles";
import { TILE_COLORS, getTileColor } from "@/lib/tile-colors";
import type { Tile } from "@/lib/types";

interface Props {
  tile: Tile;
  children: React.ReactNode;
}

export function TileContextMenu({ tile, children }: Props) {
  const router = useRouter();

  async function handlePin() {
    const result = await togglePinned(tile.id);
    if (!result.ok) toast.error(result.error);
  }

  async function handleDelete() {
    const result = await deleteTile(tile.id);
    if (result.ok) {
      toast.success("Tile slettet");
    } else {
      toast.error(result.error);
    }
  }

  async function handleColor(color: string) {
    const result = await updateTile(tile.id, { color });
    if (!result.ok) toast.error(result.error);
  }

  async function handleRename() {
    const name = prompt("Nytt navn:", tile.title);
    if (!name || name === tile.title) return;
    const result = await updateTile(tile.id, { title: name });
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleRename}>
          <Pencil className="w-4 h-4 mr-2" />
          Gi nytt navn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePin}>
          {tile.is_pinned ? (
            <>
              <PinOff className="w-4 h-4 mr-2" />
              Løsne
            </>
          ) : (
            <>
              <Pin className="w-4 h-4 mr-2" />
              Fest
            </>
          )}
        </DropdownMenuItem>
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
                  onClick={() => handleColor(c)}
                  className={`w-6 h-6 rounded-full ${getTileColor(c).accent} ${tile.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""} transition-transform hover:scale-110`}
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
          Slett
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
