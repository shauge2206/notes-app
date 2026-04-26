"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plate, PlateContent } from "@udecode/plate/react";
import { createPlateEditor } from "@udecode/plate/react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorValue = any;
import { BasicMarksPlugin } from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { ListPlugin } from "@udecode/plate-list/react";
import { toast } from "sonner";
import { saveSectionContent, renameSection } from "@/app/actions/sections";
import type { Section } from "@/lib/types";

interface Props {
  section: Section;
  onSaveStateChange?: (saving: boolean) => void;
  flushRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const plugins = [
  BasicMarksPlugin,
  HeadingPlugin,
  BlockquotePlugin,
  CodeBlockPlugin,
  HorizontalRulePlugin,
  LinkPlugin,
  ListPlugin,
];

const defaultValue: EditorValue = [{ type: "p", children: [{ text: "" }] }];

export function SectionEditor({ section, onSaveStateChange, flushRef }: Props) {
  const [title, setTitle] = useState(section.title);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef(
    createPlateEditor({
      plugins,
      value: (section.content as EditorValue) ?? defaultValue,
    })
  );

  // Reset editor when section changes
  useEffect(() => {
    setTitle(section.title);
    const val = (section.content as EditorValue) ?? defaultValue;
    editorRef.current.tf.setValue(val);
  }, [section.id]);

  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!pendingRef.current) return;
    pendingRef.current = false;

    onSaveStateChange?.(true);
    const content = editorRef.current.children;
    const plainText = editorRef.current.api.string([]);
    const result = await saveSectionContent(section.id, content, plainText);
    if (!result.ok) toast.error(result.error);
    onSaveStateChange?.(false);
  }, [section.id, onSaveStateChange]);

  // Expose flush for parent to call on section switch
  useEffect(() => {
    if (flushRef) flushRef.current = save;
    return () => { if (flushRef) flushRef.current = null; };
  }, [save, flushRef]);

  function handleChange() {
    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 800);
  }

  async function handleTitleBlur() {
    if (title.trim() && title !== section.title) {
      const result = await renameSection(section.id, title.trim());
      if (!result.ok) toast.error(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Section title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="text-2xl font-bold bg-transparent outline-none border-none text-foreground placeholder:text-muted-foreground/40"
        placeholder="Seksjonstittel..."
      />

      {/* Plate editor */}
      <Plate
        editor={editorRef.current}
        onChange={handleChange}
      >
        <PlateContent
          className="min-h-[300px] outline-none text-[17px] leading-[1.65] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted/50 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_hr]:border-border [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline"
          placeholder="Start typing, or press / for commands"
        />
      </Plate>
    </div>
  );
}
