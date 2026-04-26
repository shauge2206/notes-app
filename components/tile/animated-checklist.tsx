"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Check, PartyPopper } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from "@/app/actions/checklist";
import type { ChecklistItem } from "@/lib/types";

interface Props {
  tileId: string;
  items: ChecklistItem[];
  accentColor: string;
}

export function AnimatedChecklist({ tileId, items: initialItems, accentColor }: Props) {
  const [items, setItems] = useState(initialItems);
  const [newText, setNewText] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const unchecked = items.filter((i) => !i.is_completed);
  const checked = items.filter((i) => i.is_completed);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = useCallback(async () => {
    const text = newText.trim();
    if (!text) return;

    const tempId = `temp-${Date.now()}`;
    const newItem: ChecklistItem = {
      id: tempId,
      tile_id: tileId,
      content: text,
      is_completed: false,
      position: items.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => [...prev, newItem]);
    setNewText("");
    inputRef.current?.focus();

    const result = await addChecklistItem(tileId, text);
    if (result.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === tempId ? { ...i, id: result.data.id } : i))
      );
    } else {
      console.error("addChecklistItem failed:", result.error);
      setItems((prev) => prev.filter((i) => i.id !== tempId));
    }
  }, [newText, tileId, items.length]);

  async function handleToggle(id: string, checked: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, is_completed: checked } : i))
    );

    // Check if this completes the whole list
    const remaining = items.filter((i) => !i.is_completed && i.id !== id);
    if (checked && remaining.length === 0 && items.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    }

    await updateChecklistItem(id, { checked });
  }

  async function handleTextChange(id: string, text: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, content: text } : i))
    );
    await updateChecklistItem(id, { text });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deleteChecklistItem(id);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = unchecked.findIndex((i) => i.id === active.id);
    const newIndex = unchecked.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...unchecked];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const newItems = [...reordered, ...checked];
    setItems(newItems);

    await reorderChecklistItems(
      tileId,
      reordered.map((i) => i.id)
    );
  }

  return (
    <div className="space-y-4">
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], y: [0, -20, 0] }}
              transition={{ duration: 0.6 }}
            >
              <PartyPopper className="w-16 h-16 text-amber-400" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unchecked items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={unchecked.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence initial={false}>
            {unchecked.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                accentColor={accentColor}
                onToggle={handleToggle}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {/* Add new item */}
      <div className="flex items-center gap-3 mt-2 rounded-lg border border-dashed border-border/60 hover:border-border px-3 py-3 transition-colors focus-within:border-primary/40 focus-within:bg-accent/20">
        <span className="text-muted-foreground/40 text-lg leading-none shrink-0">+</span>
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Legg til oppgave..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Done section */}
      {checked.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <motion.span
              animate={{ rotate: showDone ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-xs"
            >
              ▶
            </motion.span>
            <Check className="w-3.5 h-3.5" />
            Fullført ({checked.length})
          </button>

          <AnimatePresence>
            {showDone &&
              checked.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 py-2 group"
                >
                  <div className="w-5 shrink-0" />
                  <Checkbox
                    checked
                    onCheckedChange={() => handleToggle(item.id, false)}
                    className={`shrink-0 ${accentColor} border-transparent`}
                  />
                  <span className="text-sm text-muted-foreground line-through opacity-50 flex-1">
                    {item.content}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SortableItem({
  item,
  accentColor,
  onToggle,
  onTextChange,
  onDelete,
}: {
  item: ChecklistItem;
  accentColor: string;
  onToggle: (id: string, checked: boolean) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleBlur() {
    setEditing(false);
    if (text.trim() !== item.content) {
      onTextChange(item.id, text.trim());
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 py-2 group rounded-md hover:bg-accent/30 px-1 -mx-1"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Checkbox */}
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
        className={`shrink-0 ${item.is_completed ? `${accentColor} border-transparent` : ""}`}
      />

      {/* Text */}
      {editing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setText(item.content);
              setEditing(false);
            }
          }}
          autoFocus
          className="flex-1 text-sm bg-transparent outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-sm text-left text-foreground"
        >
          {item.content}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
