"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pin, PinOff, Palette, Trash2, Pencil, Tag, Plus, X } from "lucide-react";
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
  allTags?: string[];
}

export function TileContextMenu({ tile, children, allTags = [] }: Props) {
  const router = useRouter();
  const tileTags = tile.tags ?? [];
  const availableToAdd = allTags.filter((t) => !tileTags.includes(t));

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

  async function handleAddTag(tag: string) {
    const newTags = [...tileTags, tag];
    const result = await updateTile(tile.id, { tags: newTags });
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddNewTag() {
    const tag = prompt("Ny tag:");
    if (!tag?.trim()) return;
    const t = tag.trim().toLowerCase();
    if (tileTags.includes(t)) return;
    await handleAddTag(t);
  }

  async function handleRemoveTag(tag: string) {
    const newTags = tileTags.filter((t) => t !== tag);
    const result = await updateTile(tile.id, { tags: newTags });
    if (result.ok) {
      router.refresh();
    } else {
      toast.error(result.error);
    }
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

        {/* Add tag submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Tag className="w-4 h-4 mr-2" />
            Legg til tag
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            {availableToAdd.map((tag) => (
              <DropdownMenuItem key={tag} onClick={() => handleAddTag(tag)}>
                <Plus className="w-3 h-3 mr-2" />
                #{tag}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddNewTag}>
              <Plus className="w-3 h-3 mr-2" />
              Ny tag...
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Remove tag submenu */}
        {tileTags.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <X className="w-4 h-4 mr-2" />
              Fjern tag
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {tileTags.map((tag) => (
                <DropdownMenuItem key={tag} onClick={() => handleRemoveTag(tag)}>
                  #{tag}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

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
