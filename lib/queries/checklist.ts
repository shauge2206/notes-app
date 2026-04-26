import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem } from "@/lib/types";

export async function getChecklistItems(tileId: string): Promise<ChecklistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("tile_id", tileId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data as ChecklistItem[];
}
