"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addWorkSession, deleteWorkSession } from "@/app/actions/work-sessions";
import type { WorkSession } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "akkurat nå";
  if (mins < 60) return `${mins}m siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "i går";
  if (days < 30) return `${days}d siden`;
  return new Date(dateStr).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

interface Props {
  tileId: string;
  sessions: WorkSession[];
  onClose: () => void;
  onSessionAdded?: () => void;
}

export function WorkSessionPanel({ tileId, sessions: initialSessions, onClose, onSessionAdded }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!note.trim()) return;
    setSaving(true);
    const result = await addWorkSession(tileId, note.trim());
    if (result.ok) {
      setSessions((prev) => [
        { id: result.data.id, tile_id: tileId, user_id: "", note: note.trim(), created_at: new Date().toISOString() },
        ...prev,
      ]);
      setNote("");
      onSessionAdded?.();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    const result = await deleteWorkSession(id);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 300, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-l border-border h-full flex flex-col overflow-hidden shrink-0"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold">Arbeidslogg</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 border-b border-border shrink-0">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Hva er neste steg? Hva ble gjort?"
          rows={3}
          className="w-full bg-muted/50 rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
        />
        <Button
          size="sm"
          className="w-full mt-2"
          onClick={handleSave}
          disabled={saving || !note.trim()}
        >
          {saving ? "Lagrer..." : "Lagre notat"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8">
            Ingen notater ennå. Legg igjen et på vei ut.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="group mb-3 last:mb-0"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {session.note}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {relativeTime(session.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
