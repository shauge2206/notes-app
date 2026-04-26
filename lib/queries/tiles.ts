import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Tile, TileWithChildren, Section, ChecklistItem, WorkSession } from "@/lib/types";

export async function getTiles(opts?: {
  tag?: string;
  pinnedOnly?: boolean;
  query?: string;
}): Promise<Tile[]> {
  const user = await requireUser();
  const supabase = await createClient();

  let q = supabase
    .from("tiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (opts?.tag) {
    q = q.contains("tags", [opts.tag]);
  }
  if (opts?.pinnedOnly) {
    q = q.eq("is_pinned", true);
  }
  if (opts?.query) {
    q = q.ilike("title", `%${opts.query}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Tile[];
}

export async function getTileById(id: string): Promise<TileWithChildren> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: tile, error } = await supabase
    .from("tiles")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !tile) throw new Error("Tile not found");

  const typedTile = tile as Tile;
  let sections: Section[] = [];
  let checklist_items: ChecklistItem[] = [];

  if (typedTile.type === "sections") {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("tile_id", id)
      .order("position", { ascending: true });
    sections = (data ?? []) as Section[];
  } else {
    const { data } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("tile_id", id)
      .order("position", { ascending: true });
    checklist_items = (data ?? []) as ChecklistItem[];
  }

  const { data: sessions } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("tile_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    ...typedTile,
    sections,
    checklist_items,
    work_sessions: (sessions ?? []) as WorkSession[],
  };
}

export async function searchTiles(query: string): Promise<Tile[]> {
  const user = await requireUser();
  const supabase = await createClient();

  // Search tile titles
  const { data: titleMatches, error: titleErr } = await supabase
    .from("tiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .ilike("title", `%${query}%`);

  if (titleErr) throw new Error(titleErr.message);

  // Search section plain_text
  const { data: sectionMatches } = await supabase
    .from("sections")
    .select("tile_id")
    .ilike("plain_text", `%${query}%`);

  const sectionTileIds = (sectionMatches ?? []).map((s) => s.tile_id);

  if (sectionTileIds.length === 0) return (titleMatches ?? []) as Tile[];

  const { data: sectionTiles } = await supabase
    .from("tiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .in("id", sectionTileIds);

  // Merge and deduplicate
  const seen = new Set<string>();
  const result: Tile[] = [];
  for (const t of [...(titleMatches ?? []), ...(sectionTiles ?? [])]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      result.push(t as Tile);
    }
  }
  return result;
}
