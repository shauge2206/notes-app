import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { FocusZone } from "@/lib/types";

export async function getFocusZones(): Promise<FocusZone[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_zones")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data as FocusZone[];
}

export async function getFocusZoneById(id: string): Promise<FocusZone> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("focus_zones")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) throw new Error("Focus zone not found");
  return data as FocusZone;
}
