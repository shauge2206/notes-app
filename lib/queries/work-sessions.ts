import { createClient } from "@/lib/supabase/server";
import type { WorkSession } from "@/lib/types";

export async function getWorkSessions(
  tileId: string,
  limit = 10
): Promise<WorkSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("tile_id", tileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data as WorkSession[];
}

export async function getLatestWorkSession(
  tileId: string
): Promise<WorkSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("tile_id", tileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as WorkSession | null;
}
