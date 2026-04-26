import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { Tile, TileWithChildren, Section, ChecklistItem, WorkSession } from "@/lib/types";

export interface SearchMatch {
  sectionTitle?: string;
  snippet?: string;
}

export interface TileSearchResult extends Tile {
  match?: SearchMatch;
  rank?: number;
}

export interface TileFilterOptions {
  zoneId?: string;
  pinnedOnly?: boolean;
  query?: string;
  tag?: string;
  type?: "checklist" | "sections";
}

export async function getTiles(opts?: TileFilterOptions): Promise<Tile[]> {
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

  if (opts?.zoneId) {
    q = q.eq("zone_id", opts.zoneId);
  }
  if (opts?.pinnedOnly) {
    q = q.eq("is_pinned", true);
  }
  if (opts?.query) {
    q = q.ilike("title", `%${opts.query}%`);
  }
  if (opts?.tag) {
    q = q.contains("tags", [opts.tag]);
  }
  if (opts?.type) {
    q = q.eq("type", opts.type);
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

export async function searchTiles(
  query: string,
  filters?: { tag?: string; pinnedOnly?: boolean; type?: string; zoneId?: string }
): Promise<TileSearchResult[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const q = query.trim();

  // Always search tile titles
  let titleQuery = supabase
    .from("tiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .ilike("title", `%${q}%`);

  if (filters?.tag) titleQuery = titleQuery.contains("tags", [filters.tag]);
  if (filters?.pinnedOnly) titleQuery = titleQuery.eq("is_pinned", true);
  if (filters?.type) titleQuery = titleQuery.eq("type", filters.type);
  if (filters?.zoneId) titleQuery = titleQuery.eq("zone_id", filters.zoneId);

  const { data: titleMatches } = await titleQuery;

  const results = new Map<string, TileSearchResult>();
  for (const t of titleMatches ?? []) {
    results.set(t.id, { ...(t as Tile), rank: 1 });
  }

  // Full-text search on sections for queries >= 3 chars
  if (q.length >= 3) {
    // Use plainto_tsquery for safe input handling
    const { data: sectionMatches } = await supabase
      .from("sections")
      .select("tile_id, title, plain_text")
      .textSearch("search_vector", q, { type: "plain", config: "norwegian" });

    for (const s of sectionMatches ?? []) {
      // Extract snippet around match
      const lowerText = (s.plain_text ?? "").toLowerCase();
      const lowerQ = q.toLowerCase();
      const idx = lowerText.indexOf(lowerQ);
      let snippet = "";
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(lowerText.length, idx + q.length + 80);
        snippet = (start > 0 ? "…" : "") + (s.plain_text ?? "").slice(start, end) + (end < lowerText.length ? "…" : "");
      } else {
        snippet = (s.plain_text ?? "").slice(0, 120);
      }

      const existing = results.get(s.tile_id);
      const match: SearchMatch = {
        sectionTitle: s.title,
        snippet,
      };

      if (existing) {
        // Keep the better match
        if (!existing.match) {
          existing.match = match;
          existing.rank = 2;
        }
      } else {
        // Need to fetch the tile with filters
        let tileQuery = supabase
          .from("tiles")
          .select("*")
          .eq("id", s.tile_id)
          .eq("user_id", user.id)
          .eq("is_archived", false);

        if (filters?.tag) tileQuery = tileQuery.contains("tags", [filters.tag]);
        if (filters?.pinnedOnly) tileQuery = tileQuery.eq("is_pinned", true);
        if (filters?.type) tileQuery = tileQuery.eq("type", filters.type);
        if (filters?.zoneId) tileQuery = tileQuery.eq("zone_id", filters.zoneId);

        const { data: tile } = await tileQuery.single();

        if (tile) {
          results.set(s.tile_id, { ...(tile as Tile), match, rank: 2 });
        }
      }
    }

    // Also search section titles via ILIKE
    const { data: sectionTitleMatches } = await supabase
      .from("sections")
      .select("tile_id, title, plain_text")
      .ilike("title", `%${q}%`);

    for (const s of sectionTitleMatches ?? []) {
      if (results.has(s.tile_id)) continue;
      let tileQuery = supabase
        .from("tiles")
        .select("*")
        .eq("id", s.tile_id)
        .eq("user_id", user.id)
        .eq("is_archived", false);

      if (filters?.tag) tileQuery = tileQuery.contains("tags", [filters.tag]);
      if (filters?.pinnedOnly) tileQuery = tileQuery.eq("is_pinned", true);
      if (filters?.type) tileQuery = tileQuery.eq("type", filters.type);
      if (filters?.zoneId) tileQuery = tileQuery.eq("zone_id", filters.zoneId);

      const { data: tile } = await tileQuery.single();

      if (tile) {
        results.set(s.tile_id, {
          ...(tile as Tile),
          match: { sectionTitle: s.title, snippet: (s.plain_text ?? "").slice(0, 120) },
          rank: 1.5,
        });
      }
    }
  }

  // Sort by rank desc
  return Array.from(results.values()).sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
}
