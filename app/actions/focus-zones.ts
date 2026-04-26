"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function createFocusZone(input: {
  name: string;
  color?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("focus_zones")
      .select("position")
      .eq("user_id", user.id)
      .order("position", { ascending: false })
      .limit(1);

    const position = existing?.length ? existing[0].position + 1 : 0;

    const { data, error } = await supabase
      .from("focus_zones")
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        color: input.color ?? "slate",
        position,
      })
      .select("id")
      .single();

    if (error || !data) return { ok: false, error: error?.message ?? "Failed to create zone" };

    revalidatePath("/");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateFocusZone(
  id: string,
  patch: { name?: string; color?: string }
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("focus_zones")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteFocusZone(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("focus_zones")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reorderFocusZones(ids: string[]): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase
        .from("focus_zones")
        .update({ position: i })
        .eq("id", ids[i])
        .eq("user_id", user.id);
      if (error) return { ok: false, error: error.message };
    }

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
