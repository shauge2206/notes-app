"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addWorkSession } from "@/app/actions/work-sessions";

interface Props {
  tileId: string;
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function ExitPrompt({ tileId, open, onComplete, onCancel }: Props) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!note.trim()) {
      onComplete();
      return;
    }
    setSaving(true);
    await addWorkSession(tileId, note.trim());
    setSaving(false);
    setNote("");
    onComplete();
  }

  function handleSkip() {
    setNote("");
    onComplete();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg igjen et notat?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="Hva er neste steg?"
            rows={3}
            autoFocus
            className="w-full bg-muted/50 rounded-md px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Hopp over
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Lagrer..." : "Lagre og gå"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
