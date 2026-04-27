"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { GripVertical, Pencil, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { createSection, renameSection, deleteSection, reorderSections } from "@/app/actions/sections";
import { getTileColor } from "@/lib/tile-colors";
import type { Section } from "@/lib/types";

interface Props {
  tileId: string;
  tileColor: string;
  sections: Section[];
  activeSectionId: string;
  onBeforeSwitch?: () => Promise<void>;
}

export function SectionsRail({ tileId, tileColor, sections: initialSections, activeSectionId, onBeforeSwitch }: Props) {
  const [sections, setSections] = useState(initialSections);
  const router = useRouter();

  // Sync local state when server data changes (e.g. after router.refresh)
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);
  const searchParams = useSearchParams();
  const color = getTileColor(tileColor);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleSwitchSection(sectionId: string) {
    if (sectionId === activeSectionId) return;
    if (onBeforeSwitch) await onBeforeSwitch();
    const params = new URLSearchParams(searchParams.toString());
    params.set("s", sectionId);
    router.push(`?${params.toString()}`);
  }

  async function handleAddSection() {
    const result = await createSection(tileId, "Untitled section");
    if (result.ok) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("s", result.data.id);
      router.push(`?${params.toString()}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleRename(id: string, newTitle: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
    const result = await renameSection(id, newTitle);
    if (!result.ok) toast.error(result.error);
  }

  async function handleDelete(id: string) {
    const result = await deleteSection(id);
    if (result.ok) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      if (id === activeSectionId) {
        const remaining = sections.filter((s) => s.id !== id);
        if (remaining.length) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("s", remaining[0].id);
          router.push(`?${params.toString()}`);
        }
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setSections(reordered);

    await reorderSections(tileId, reordered.map((s) => s.id));
  }

  return (
    <nav aria-label="Seksjoner" className="flex flex-col gap-1 py-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSectionItem
              key={section.id}
              section={section}
              isActive={section.id === activeSectionId}
              accentClass={color.accent}
              onSelect={() => handleSwitchSection(section.id)}
              onRename={(title) => handleRename(section.id, title)}
              onDelete={() => handleDelete(section.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddSection}
        className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50 mt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        Ny seksjon
      </button>
    </nav>
  );
}

function SortableSectionItem({
  section,
  isActive,
  accentClass,
  onSelect,
  onRename,
  onDelete,
}: {
  section: Section;
  isActive: boolean;
  accentClass: string;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function handleBlur() {
    setEditing(false);
    if (title.trim() && title !== section.title) {
      onRename(title.trim());
    } else {
      setTitle(section.title);
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        isActive
          ? `bg-accent/60 border-l-2 ${accentClass.replace("bg-", "border-")}`
          : "hover:bg-accent/30 border-l-2 border-transparent"
      }`}
      onClick={() => !editing && onSelect()}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground shrink-0 p-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {editing ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") { setTitle(section.title); setEditing(false); }
          }}
          autoFocus
          className="flex-1 text-xs bg-transparent outline-none min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-xs truncate">{section.title}</span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="p-0.5 text-muted-foreground hover:text-foreground rounded"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 text-muted-foreground hover:text-destructive rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
