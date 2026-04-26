export type TileType = "checklist" | "sections";

export interface Tile {
  id: string;
  user_id: string;
  title: string;
  type: TileType;
  color: string;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  tile_id: string;
  title: string;
  content: string;
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
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}
