import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/lib/types";

export async function getSections(tileId: string): Promise<Section[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("tile_id", tileId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Section[];
}

export async function getSectionById(id: string): Promise<Section> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Section not found");
  return data as Section;
}
