"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: "⌘K", description: "Søk" },
  { keys: "⌘N", description: "Ny tile" },
  { keys: "⌘/", description: "Vis snarveier" },
  { keys: "Esc", description: "Lukk dialog / tøm søk" },
  { keys: "⌘1–9", description: "Gå til seksjon (i seksjon-tile)" },
  { keys: "⌘J", description: "Vis/skjul arbeidslogg" },
  { keys: "⌘S", description: "Lagre (i editor)" },
];

interface Props {
  onNewTile?: () => void;
}

export function KeyboardShortcuts({ onNewTile }: Props) {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘/ — show shortcuts
      if (mod && e.key === "/") {
        e.preventDefault();
        setShowHelp((v) => !v);
      }

      // ⌘N — new tile
      if (mod && e.key === "n") {
        e.preventDefault();
        onNewTile?.();
        window.dispatchEvent(new CustomEvent("open-new-tile"));
      }

      // Escape — close help
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showHelp, onNewTile, router]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hurtigtaster</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-foreground">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
