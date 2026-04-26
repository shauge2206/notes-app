import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export interface TagCount {
  tag: string;
  count: number;
}

export async function getAllTags(): Promise<TagCount[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_user_tags", {
    uid: user.id,
  });

  if (error) {
    // Fallback: fetch tiles and count tags client-side
    const { data: tiles } = await supabase
      .from("tiles")
      .select("tags")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    const counts = new Map<string, number>();
    for (const t of tiles ?? []) {
      for (const tag of (t.tags as string[]) ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  return (data ?? []) as TagCount[];
}
