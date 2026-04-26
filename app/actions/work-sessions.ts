"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function addWorkSession(
  tileId: string,
  note: string
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!note.trim()) return { ok: false, error: "Empty note" };

    const user = await requireUser();
    const supabase = await createClient();

    // Verify tile belongs to user
    const { data: tile, error: tileErr } = await supabase
      .from("tiles")
      .select("id")
      .eq("id", tileId)
      .eq("user_id", user.id)
      .single();

    if (tileErr || !tile) return { ok: false, error: "Tile not found" };

    const { data, error } = await supabase
      .from("work_sessions")
      .insert({
        tile_id: tileId,
        user_id: user.id,
        note: note.trim(),
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed to add session" };

    // Touch tile updated_at
    await supabase
      .from("tiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", tileId)
      .eq("user_id", user.id);

    revalidatePath("/");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateWorkSession(
  id: string,
  note: string
): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("work_sessions")
      .update({ note: note.trim() })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteWorkSession(id: string): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();

    const { error } = await supabase.from("work_sessions").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
