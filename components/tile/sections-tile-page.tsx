"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Pin,
  PinOff,
  Trash2,
  MoreHorizontal,
  Palette,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { updateTile, deleteTile, togglePinned } from "@/app/actions/tiles";
import { deleteWorkSession } from "@/app/actions/work-sessions";
import { TILE_COLORS, getTileColor } from "@/lib/tile-colors";
import { SectionsRail } from "@/components/tile/sections-rail";
import { SectionEditor } from "@/components/tile/section-editor";
import { WorkSessionPanel } from "@/components/tile/work-session-panel";
import { ExitPrompt } from "@/components/tile/exit-prompt";
import { TagEditor } from "@/components/tag-editor";
import { SavedIndicator } from "@/components/saved-indicator";
import type { TileWithChildren, Section, WorkSession } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "akkurat nå";
  if (mins < 60) return `${mins}m siden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}t siden`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "i går";
  return `${days}d siden`;
}

interface Props {
  tile: TileWithChildren;
  activeSectionId: string;
  allTags?: string[];
}

export function SectionsTilePage({ tile, activeSectionId, allTags = [] }: Props) {
  const [title, setTitle] = useState(tile.title);
  const [isPinned, setIsPinned] = useState(tile.is_pinned);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(tile.color);
  const [tags, setTags] = useState(tile.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [latestSession, setLatestSession] = useState<WorkSession | null>(
    tile.work_sessions[0] ?? null
  );
  const mountTime = useRef(Date.now());
  const lastSessionSave = useRef(0);
  const flushRef = useRef<(() => Promise<void>) | null>(null);
  const router = useRouter();
  const tileColor = getTileColor(color);

  const activeSection = tile.sections.find((s) => s.id === activeSectionId) ?? tile.sections[0];

  // beforeunload
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      const onPageMs = Date.now() - mountTime.current;
      const recentSave = Date.now() - lastSessionSave.current < 300_000;
      if (onPageMs > 30_000 && !recentSave) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Keyboard shortcuts: ⌘1-9, ⌘B, ⌘S
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      // ⌘1-9 — jump to section by index
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        const section = tile.sections[num - 1];
        if (section) {
          const params = new URLSearchParams(window.location.search);
          params.set("s", section.id);
          window.history.replaceState(null, "", `?${params.toString()}`);
          window.location.reload();
        }
      }

      // ⌘J — toggle work session panel
      if (e.key === "j") {
        e.preventDefault();
        setShowPanel((v) => !v);
      }

      // ⌘S — flush save
      if (e.key === "s") {
        e.preventDefault();
        if (flushRef.current) {
          flushRef.current().then(() => {
            toast.success("Lagret", { duration: 1000 });
          });
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [tile.sections]);

  const handleNavigateAway = useCallback(
    async (dest: string) => {
      if (flushRef.current) await flushRef.current();

      const onPageMs = Date.now() - mountTime.current;
      const recentSave = Date.now() - lastSessionSave.current < 300_000;

      if (onPageMs > 30_000 && !recentSave) {
        setPendingNav(dest);
        setShowExitPrompt(true);
      } else {
        router.push(dest);
      }
    },
    [router]
  );

  function handleExitComplete() {
    setShowExitPrompt(false);
    lastSessionSave.current = Date.now();
    if (pendingNav) {
      router.push(pendingNav);
      setPendingNav(null);
    }
  }

  async function handleTitleBlur() {
    if (title.trim() && title !== tile.title) {
      const result = await updateTile(tile.id, { title: title.trim() });
      if (!result.ok) toast.error(result.error);
    }
  }

  async function handlePin() {
    setIsPinned((p) => !p);
    const result = await togglePinned(tile.id);
    if (!result.ok) {
      setIsPinned((p) => !p);
      toast.error(result.error);
    }
  }

  async function handleColorChange(c: string) {
    setColor(c);
    const result = await updateTile(tile.id, { color: c });
    if (!result.ok) toast.error(result.error);
  }

  async function handleTagsChange(newTags: string[]) {
    setTags(newTags);
    const result = await updateTile(tile.id, { tags: newTags });
    if (!result.ok) toast.error(result.error);
  }

  async function handleDelete() {
    const result = await deleteTile(tile.id);
    if (result.ok) router.push("/");
    else toast.error(result.error);
  }

  async function handleDismissSession() {
    if (!latestSession) return;
    await deleteWorkSession(latestSession.id);
    setLatestSession(null);
  }

  async function handleBeforeSectionSwitch() {
    if (flushRef.current) await flushRef.current();
  }

  if (!activeSection) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} aria-label="Tilbake til dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold">{tile.title}</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Ingen seksjoner funnet.</p>
            <Button size="sm" onClick={async () => {
              const { createSection } = await import("@/app/actions/sections");
              const result = await createSection(tile.id, "Overview");
              if (result.ok) router.refresh();
            }}>
              Opprett seksjon
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => handleNavigateAway("/")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="border-none bg-transparent text-lg font-semibold h-auto p-0 focus-visible:ring-0 shadow-none max-w-sm"
          />

          <div className="flex items-center gap-1 ml-auto shrink-0">
            <SavedIndicator saving={saving} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPanel((v) => !v)}
              title="Arbeidslogg"
              aria-label="Vis/skjul arbeidslogg"
            >
              <BookOpen className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handlePin} aria-label={isPinned ? "Løsne tile" : "Fest tile"}>
              {isPinned ? (
                <Pin className="w-4 h-4 text-amber-400 fill-amber-400" />
              ) : (
                <PinOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md w-9 h-9 hover:bg-accent transition-colors" aria-label="Flere valg">
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="w-4 h-4 mr-2" />
                    Farge
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <div className="flex gap-1.5 p-2">
                      {TILE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(c)}
                          className={`w-6 h-6 rounded-full ${getTileColor(c).accent} ${
                            color === c ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                          } transition-transform hover:scale-110`}
                        />
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Slett tile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags */}
        <div className="px-6 py-2 border-b border-border">
          <TagEditor tags={tags} onChange={handleTagsChange} suggestions={allTags} />
        </div>

        {/* Next session banner */}
        {latestSession && (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.7, 1, 0.7, 1] }}
            transition={{ duration: 1.5, times: [0, 0.3, 0.6, 1] }}
            className="flex items-center gap-3 px-6 py-2.5 border-b border-border text-sm"
            style={{
              borderLeftWidth: 3,
              borderLeftColor: tileColor.hex,
              backgroundColor: `${tileColor.hex}08`,
            }}
          >
            <span
              className="text-[10px] uppercase font-bold tracking-wider shrink-0 px-1.5 py-0.5 rounded"
              style={{ color: tileColor.hex, backgroundColor: `${tileColor.hex}15` }}
            >
              Neste steg
            </span>
            <p className="flex-1 text-foreground/90 line-clamp-2 text-xs font-medium">
              {latestSession.note}
            </p>
            <span className="text-[10px] text-muted-foreground/40 shrink-0">
              {relativeTime(latestSession.created_at)}
            </span>
            <button
              onClick={handleDismissSession}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Fjern"
              aria-label="Fjern neste-steg notat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Toolbar slot — toolbar gets portaled here from the editor */}
        <div
          ref={toolbarRef}
          className="px-4 py-1.5 border-b border-border/50 bg-card/50 shrink-0 empty:hidden flex justify-center"
        />

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left rail */}
          <div className="w-[220px] border-r border-border overflow-y-auto shrink-0 hidden md:block">
            <SectionsRail
              tileId={tile.id}
              tileColor={color}
              sections={tile.sections}
              activeSectionId={activeSection.id}
              onBeforeSwitch={handleBeforeSectionSwitch}
            />
          </div>

          {/* Center editor — scroll container */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
            <motion.div
              key={activeSection.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-w-4xl mx-auto px-8 py-6"
            >
              <SectionEditor
                section={activeSection}
                tileId={tile.id}
                onSaveStateChange={setSaving}
                flushRef={flushRef}
                toolbarPortal={toolbarRef}
              />
            </motion.div>
            </AnimatePresence>
          </div>

          {/* Right panel */}
          <AnimatePresence>
            {showPanel && (
              <WorkSessionPanel
                tileId={tile.id}
                sessions={tile.work_sessions}
                onClose={() => setShowPanel(false)}
                onSessionAdded={() => {
                  lastSessionSave.current = Date.now();
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Exit prompt */}
      <ExitPrompt
        tileId={tile.id}
        open={showExitPrompt}
        onComplete={handleExitComplete}
        onCancel={() => setShowExitPrompt(false)}
      />
    </>
  );
}
