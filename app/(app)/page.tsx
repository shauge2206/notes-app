import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getFocusZones } from "@/lib/queries/focus-zones";
import { DashboardTopBar } from "@/components/dashboard-top-bar";
import { TileGrid } from "@/components/tile-grid";
import { EmptyState } from "@/components/empty-state";
import type { Tile } from "@/lib/types";

interface Props {
  searchParams: Promise<{ q?: string; zone?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const zones = await getFocusZones();

  let query = supabase
    .from("tiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("is_pinned", { ascending: false })
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (params.zone) {
    query = query.eq("zone_id", params.zone);
  }
  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }

  const { data: tiles } = await query;
  const typedTiles = (tiles ?? []) as Tile[];

  if (typedTiles.length === 0 && !params.q) {
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

  const checklistTileIds = typedTiles
    .filter((t) => t.type === "checklist")
    .map((t) => t.id);
  const sectionsTileIds = typedTiles
    .filter((t) => t.type === "sections")
    .map((t) => t.id);

  // Fetch all previews in parallel
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

  // Process checklist previews
  if (checklistResult?.data) {
    const counts: Record<string, { remaining: number; total: number }> = {};
    for (const item of checklistResult.data) {
      if (!counts[item.tile_id]) counts[item.tile_id] = { remaining: 0, total: 0 };
      counts[item.tile_id].total++;
      if (!item.is_completed) counts[item.tile_id].remaining++;
    }
    for (const id of checklistTileIds) {
      previews[id] = {
        type: "checklist",
        ...(counts[id] ?? { remaining: 0, total: 0 }),
      };
    }
  }

  // Process sections previews
  if (sectionsTileIds.length > 0) {
    const latestSession: Record<string, string> = {};
    for (const s of sessionsResult?.data ?? []) {
      if (!latestSession[s.tile_id] && s.note) {
        latestSession[s.tile_id] = s.note;
      }
    }

    const sectionTexts: Record<string, string> = {};
    for (const s of sectionsResult?.data ?? []) {
      if (!sectionTexts[s.tile_id] && s.plain_text) {
        sectionTexts[s.tile_id] = s.plain_text;
      }
    }

    for (const id of sectionsTileIds) {
      const sessionNote = latestSession[id];
      const sectionText = sectionTexts[id];
      const text = sessionNote
        ? `Next: ${sessionNote.slice(0, 120)}`
        : sectionText
          ? sectionText.slice(0, 120)
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
        />
      </div>
    </div>
  );
}
