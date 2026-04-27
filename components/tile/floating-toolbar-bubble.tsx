"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, X, GripVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { EditorToolbar } from "@/components/tile/editor-toolbar";
import { FloatingTableToolbar } from "@/components/tile/floating-table-toolbar";

interface Props {
  onInsertImage?: () => void;
}

const STORAGE_KEY = "toolbar-bubble-position";

function getInitialPosition(): { x: number; y: number } {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
}

export function FloatingToolbarBubble({ onInsertImage }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(getInitialPosition);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure initial position is valid
    setPosition((pos) => ({
      x: Math.min(pos.x, window.innerWidth - 60),
      y: Math.min(pos.y, window.innerHeight - 60),
    }));
  }, []);

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newX = Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startPosX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startPosY + dy));
      setPosition({ x: newX, y: newY });
    }

    function onUp() {
      setDragging(false);
      dragRef.current = null;
      setPosition((pos) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
        return pos;
      });
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (!mounted) return null;

  const bubble = (
    <div
      className="flex flex-col items-end gap-2"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 flex flex-col gap-2 items-end"
          >
            <div className="max-h-[60vh] overflow-y-auto">
              <EditorToolbar onInsertImage={onInsertImage} />
            </div>
            <FloatingTableToolbar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-0">
        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          className={`w-6 h-12 rounded-l-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
            open
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-r-0 border-border text-muted-foreground/40 hover:text-muted-foreground"
          }`}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Toggle button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !dragging && setOpen((v) => !v)}
          className={`w-12 h-12 rounded-r-full shadow-lg flex items-center justify-center transition-colors ${
            open
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-l-0 border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
          }`}
          aria-label={open ? "Lukk verktøy" : "Åpne verktøy"}
        >
          {open ? <X className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  );

  try {
    return createPortal(bubble, document.body);
  } catch {
    return bubble;
  }
}
