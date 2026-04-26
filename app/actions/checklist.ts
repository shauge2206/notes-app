"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

async function verifyTileType(supabase: Awaited<ReturnType<typeof createClient>>, tileId: string, userId: string) {
  const { data, error } = await supabase
    .from("tiles")
    .select("type")
    .eq("id", tileId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Tile not found");
  if (data.type !== "checklist") throw new Error("This tile is not a checklist tile");
}

export async function addChecklistItem(
  tileId: string,
  text: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    await verifyTileType(supabase, tileId, user.id);

    const { data: existing } = await supabase
      .from("checklist_items")
      .select("position")
      .eq("tile_id", tileId)
      .order("position", { ascending: false })
      .limit(1);

    const position = existing?.length ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        tile_id: tileId,
        content: text,
        is_completed: false,
        position,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed to add item" };

    revalidatePath("/");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateChecklistItem(
  id: string,
  patch: { text?: string; checked?: boolean }
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.text !== undefined) updates.content = patch.text;
    if (patch.checked !== undefined) updates.is_completed = patch.checked;

    const { error } = await supabase
      .from("checklist_items")
      .update(updates)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteChecklistItem(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase.from("checklist_items").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reorderChecklistItems(
  tileId: string,
  ids: string[]
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase
        .from("checklist_items")
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
