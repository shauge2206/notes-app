"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUT_GROUPS = [
  {
    title: "Generelt",
    shortcuts: [
      { keys: "⌘K", description: "Søk" },
      { keys: "⌘N", description: "Ny tile" },
      { keys: "⌘/", description: "Vis snarveier" },
      { keys: "Esc", description: "Lukk dialog / tøm søk" },
    ],
  },
  {
    title: "Seksjon-tile",
    shortcuts: [
      { keys: "⌘1–9", description: "Gå til seksjon" },
      { keys: "⌘J", description: "Vis/skjul arbeidslogg" },
      { keys: "⌘S", description: "Lagre" },
    ],
  },
  {
    title: "Tekst-editor",
    shortcuts: [
      { keys: "⌘B", description: "Fet skrift" },
      { keys: "⌘I", description: "Kursiv" },
      { keys: "⌘U", description: "Understreking" },
      { keys: "/", description: "Slash-kommandoer" },
      { keys: "Esc", description: "Avslutt liste / blokk" },
    ],
  },
  {
    title: "Tabell",
    shortcuts: [
      { keys: "Tab", description: "Neste celle" },
      { keys: "Shift+Tab", description: "Forrige celle" },
      { keys: "Esc", description: "Gå ut av tabell" },
    ],
  },
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

      if (mod && e.key === "/") {
        e.preventDefault();
        setShowHelp((v) => !v);
      }

      if (mod && e.key === "n") {
        e.preventDefault();
        onNewTile?.();
        window.dispatchEvent(new CustomEvent("open-new-tile"));
      }

      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    }

    // Listen for sidebar trigger
    function handleOpen() { setShowHelp(true); }
    window.addEventListener("open-shortcuts", handleOpen);

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-shortcuts", handleOpen);
    };
  }, [showHelp, onNewTile, router]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hurtigtaster</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-3 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                    <kbd className="px-2 py-0.5 rounded bg-muted text-[11px] font-mono text-foreground">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
