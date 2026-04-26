"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionResult, TileType } from "@/lib/types";

export async function createTile(input: {
  title: string;
  type: TileType;
  color?: string;
  size?: string;
  zone_id?: string;
  tags?: string[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    // Get max position
    const { data: existing } = await supabase
      .from("tiles")
      .select("position")
      .eq("user_id", user.id)
      .order("position", { ascending: false })
      .limit(1);

    const position = existing?.length ? existing[0].position + 1 : 0;

    const { data: tile, error } = await supabase
      .from("tiles")
      .insert({
        user_id: user.id,
        title: input.title,
        type: input.type,
        color: input.color ?? "slate",
        size: input.size ?? "medium",
        position,
        zone_id: input.zone_id ?? null,
        tags: input.tags ?? [],
        is_pinned: false,
        is_archived: false,
      })
      .select("id")
      .single();

    if (error || !tile) return { ok: false, error: error?.message ?? "Failed to create tile" };

    // Create default section for sections-type tiles
    if (input.type === "sections") {
      const { error: secError } = await supabase.from("sections").insert({
        tile_id: tile.id,
        title: "Overview",
        content: null,
        plain_text: "",
        position: 0,
      });
      if (secError) {
        console.error("Failed to create default section:", secError);
        return { ok: false, error: secError.message };
      }
    }

    revalidatePath("/");
    return { ok: true, data: { id: tile.id } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateTile(
  id: string,
  patch: Record<string, unknown>
): Promise<ActionResult> {
  try {
    if ("type" in patch) {
      return { ok: false, error: "Tile type cannot be changed after creation" };
    }

    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("tiles")
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

export async function deleteTile(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { error } = await supabase
      .from("tiles")
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

export async function togglePinned(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: tile, error: fetchErr } = await supabase
      .from("tiles")
      .select("is_pinned")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !tile) return { ok: false, error: "Tile not found" };

    const { error } = await supabase
      .from("tiles")
      .update({ is_pinned: !tile.is_pinned, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reorderTiles(ids: string[]): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase
        .from("tiles")
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
