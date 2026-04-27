import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getFocusZones } from "@/lib/queries/focus-zones";
import { getAllTags } from "@/lib/queries/tags";
import { searchTiles, type TileSearchResult } from "@/lib/queries/tiles";
import { DashboardTopBar } from "@/components/dashboard-top-bar";
import { TileGrid } from "@/components/tile-grid";
import { EmptyState } from "@/components/empty-state";
import type { Tile } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string; zone?: string; tag?: string; pinned?: string; type?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const [zones, tagCounts] = await Promise.all([getFocusZones(), getAllTags()]);
  const allTags = tagCounts.map((t) => t.tag);
  const isSearching = !!params.q?.trim();

  // Search mode
  if (isSearching) {
    const results = await searchTiles(params.q!, {
      tag: params.tag,
      pinnedOnly: params.pinned === "1",
      type: params.type === "checklist" || params.type === "sections" ? params.type : undefined,
      zoneId: params.zone,
    });

    // Build search previews from match data
    const previews: Record<
      string,
      | { type: "checklist"; remaining: number; total: number }
      | { type: "sections"; text: string }
    > = {};

    for (const r of results) {
      if (r.match?.snippet) {
        const prefix = r.match.sectionTitle
          ? `I '${r.match.sectionTitle}': `
          : "";
        previews[r.id] = { type: "sections", text: prefix + r.match.snippet };
      }
    }

    return (
      <div className="flex flex-col h-full">
        <DashboardTopBar activeZoneId={params.zone} />
        <div className="flex-1 overflow-auto p-6">
          {results.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {results.length} resultat{results.length !== 1 ? "er" : ""} for &lsquo;{params.q}&rsquo;
              </p>
              <TileGrid
                tiles={results}
                zones={zones}
                previews={previews}
                groupByZone={false}
                allTags={allTags}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-muted-foreground">
                Ingen tiles matcher &lsquo;{params.q}&rsquo;
              </p>
              <a
                href="/"
                className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Tøm søk
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Normal mode
  let query = supabase
    .from("tiles")
    .select("id, user_id, zone_id, title, type, color, size, position, is_pinned, is_archived, tags, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (params.zone) {
    query = query.eq("zone_id", params.zone);
  }
  if (params.tag) {
    query = query.contains("tags", [params.tag]);
  }
  if (params.pinned === "1") {
    query = query.eq("is_pinned", true);
  }
  if (params.type === "checklist" || params.type === "sections") {
    query = query.eq("type", params.type);
  }

  const { data: tiles } = await query;
  const typedTiles = (tiles ?? []) as Tile[];

  if (typedTiles.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <DashboardTopBar activeZoneId={params.zone} />
        <EmptyState zones={zones} activeZoneId={params.zone} />
      </div>
    );
  }

  // Build previews
  const previews: Record<
    string,
    | { type: "checklist"; remaining: number; total: number }
    | { type: "sections"; text: string }
  > = {};

  const checklistTileIds = typedTiles.filter((t) => t.type === "checklist").map((t) => t.id);
  const sectionsTileIds = typedTiles.filter((t) => t.type === "sections").map((t) => t.id);

  const [checklistResult, sessionsResult, sectionsResult] = await Promise.all([
    checklistTileIds.length > 0
      ? supabase.from("checklist_items").select("tile_id, is_completed").in("tile_id", checklistTileIds)
      : null,
    sectionsTileIds.length > 0
      ? supabase.from("work_sessions").select("tile_id, note").in("tile_id", sectionsTileIds).order("created_at", { ascending: false })
      : null,
    sectionsTileIds.length > 0
      ? supabase.from("sections").select("tile_id, plain_text").in("tile_id", sectionsTileIds).order("position", { ascending: true })
      : null,
  ]);

  if (checklistResult?.data) {
    const counts: Record<string, { remaining: number; total: number }> = {};
    for (const item of checklistResult.data) {
      if (!counts[item.tile_id]) counts[item.tile_id] = { remaining: 0, total: 0 };
      counts[item.tile_id].total++;
      if (!item.is_completed) counts[item.tile_id].remaining++;
    }
    for (const id of checklistTileIds) {
      previews[id] = { type: "checklist", ...(counts[id] ?? { remaining: 0, total: 0 }) };
    }
  }

  if (sectionsTileIds.length > 0) {
    const latestSession: Record<string, string> = {};
    for (const s of sessionsResult?.data ?? []) {
      if (!latestSession[s.tile_id] && s.note) latestSession[s.tile_id] = s.note;
    }
    const sectionTexts: Record<string, string> = {};
    for (const s of sectionsResult?.data ?? []) {
      if (!sectionTexts[s.tile_id] && s.plain_text) sectionTexts[s.tile_id] = s.plain_text;
    }
    for (const id of sectionsTileIds) {
      const text = latestSession[id]
        ? `Neste steg: ${latestSession[id].slice(0, 120)}`
        : sectionTexts[id]
          ? sectionTexts[id].slice(0, 120)
          : "";
      previews[id] = { type: "sections", text };
    }
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardTopBar activeZoneId={params.zone} />
      <div className="flex-1 overflow-auto p-6">
        <TileGrid
          tiles={typedTiles}
          zones={zones}
          previews={previews}
          groupByZone={!params.zone}
          allTags={allTags}
        />
      </div>
    </div>
  );
}
