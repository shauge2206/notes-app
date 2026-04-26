export type TileType = "checklist" | "sections";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JSONContent = any;

export interface FocusZone {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Tile {
  id: string;
  user_id: string;
  zone_id: string | null;
  title: string;
  type: TileType;
  color: string;
  size: string;
  position: number;
  is_pinned: boolean;
  is_archived: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  tile_id: string;
  title: string;
  content: JSONContent | null;
  plain_text: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  tile_id: string;
  content: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface WorkSession {
  id: string;
  tile_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface TileWithChildren extends Tile {
  sections: Section[];
  checklist_items: ChecklistItem[];
  work_sessions: WorkSession[];
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
