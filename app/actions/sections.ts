"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult, JSONContent } from "@/lib/types";

async function verifyTileType(supabase: Awaited<ReturnType<typeof createClient>>, tileId: string, userId: string) {
  const { data, error } = await supabase
    .from("tiles")
    .select("type")
    .eq("id", tileId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Tile not found");
  if (data.type !== "sections") throw new Error("This tile is not a sections tile");
}

export async function createSection(
  tileId: string,
  title?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    await verifyTileType(supabase, tileId, user.id);

    const { data: existing } = await supabase
      .from("sections")
      .select("position")
      .eq("tile_id", tileId)
      .order("position", { ascending: false })
      .limit(1);

    const position = existing?.length ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("sections")
      .insert({
        tile_id: tileId,
        title: title ?? "Untitled",
        content: null,
        plain_text: "",
        position,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed to create section" };

    revalidatePath("/");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function renameSection(
  id: string,
  title: string
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("sections")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteSection(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    // Get the section to find its tile_id
    const { data: section, error: fetchErr } = await supabase
      .from("sections")
      .select("tile_id")
      .eq("id", id)
      .single();

    if (fetchErr || !section) return { ok: false, error: "Section not found" };

    // Check if it's the only section
    const { count } = await supabase
      .from("sections")
      .select("id", { count: "exact", head: true })
      .eq("tile_id", section.tile_id);

    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Cannot delete the last section in a tile" };
    }

    const { error } = await supabase.from("sections").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reorderSections(
  tileId: string,
  ids: string[]
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase
        .from("sections")
        .update({ position: i })
        .eq("id", ids[i])
        .eq("tile_id", tileId);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function saveSectionContent(
  id: string,
  content: JSONContent,
  plainText: string
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("sections")
      .update({
        content,
        plain_text: plainText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    // No revalidatePath — autosave shouldn't trigger page refetch
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
