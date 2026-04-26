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
import { ImagePlugin } from "@udecode/plate-media/react";
import { toast } from "sonner";
import { saveSectionContent, renameSection } from "@/app/actions/sections";
import { uploadNoteImage, deleteNoteImage } from "@/lib/storage";
import { InlineImage } from "@/components/tile/editor-image";
import { SlashMenu, type SlashCommand } from "@/components/tile/slash-menu";
import { EditorContextProvider } from "@/components/tile/editor-context";
import type { Section } from "@/lib/types";

interface Props {
  section: Section;
  tileId: string;
  onSaveStateChange?: (saving: boolean) => void;
  flushRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const defaultValue: EditorValue = [{ type: "p", children: [{ text: "" }] }];

export function SectionEditor({ section, tileId, onSaveStateChange, flushRef }: Props) {
  const [title, setTitle] = useState(section.title);
  const [uploading, setUploading] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastImageUrls = useRef<Set<string>>(new Set());

  const plugins = [
    BasicMarksPlugin,
    HeadingPlugin,
    BlockquotePlugin,
    CodeBlockPlugin,
    HorizontalRulePlugin,
    LinkPlugin,
    ListPlugin,
    ImagePlugin.configure({
      render: {
        node: InlineImage,
      },
      options: {
        disableUploadInsert: true,
      },
      handlers: {
        // Disable plugin's built-in paste — we handle it ourselves
      },
    }),
  ];

  const editorRef = useRef(
    createPlateEditor({
      plugins,
      value: (section.content as EditorValue) ?? defaultValue,
    })
  );

  function extractImageUrls(nodes: EditorValue): Set<string> {
    const urls = new Set<string>();
    function walk(node: EditorValue) {
      if (!node) return;
      if (node.type === "img" && node.url) urls.add(node.url as string);
      if (Array.isArray(node.children)) node.children.forEach(walk);
      if (Array.isArray(node)) node.forEach(walk);
    }
    walk(nodes);
    return urls;
  }

  // Reset editor when section changes
  useEffect(() => {
    setTitle(section.title);
    const val = (section.content as EditorValue) ?? defaultValue;
    editorRef.current.tf.setValue(val);
    lastImageUrls.current = extractImageUrls(val);
    setSlashOpen(false);
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

    // Detect removed images and clean up storage
    const currentUrls = extractImageUrls(content);
    for (const url of lastImageUrls.current) {
      if (!currentUrls.has(url)) {
        deleteNoteImage(url);
      }
    }
    lastImageUrls.current = currentUrls;
    const result = await saveSectionContent(section.id, content, plainText);
    if (!result.ok) toast.error(result.error);
    onSaveStateChange?.(false);
  }, [section.id, onSaveStateChange]);

  useEffect(() => {
    if (flushRef) flushRef.current = save;
    return () => {
      if (flushRef) flushRef.current = null;
    };
  }, [save, flushRef]);

  function handleChange() {
    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 800);

    // Detect slash command
    detectSlash();
  }

  function detectSlash() {
    const editor = editorRef.current;
    const { selection } = editor;
    if (!selection) {
      setSlashOpen(false);
      return;
    }

    try {
      const [node] = editor.api.node(selection.anchor.path) ?? [];
      if (!node || typeof node !== "object" || !("text" in node)) {
        setSlashOpen(false);
        return;
      }
      const text = (node as { text: string }).text;
      const offset = selection.anchor.offset;

      // Find the last "/" before cursor
      const beforeCursor = text.slice(0, offset);
      const slashIdx = beforeCursor.lastIndexOf("/");

      if (slashIdx === -1 || (slashIdx > 0 && beforeCursor[slashIdx - 1] !== " " && beforeCursor[slashIdx - 1] !== "\n")) {
        setSlashOpen(false);
        return;
      }

      const query = beforeCursor.slice(slashIdx + 1);
      if (query.includes(" ")) {
        setSlashOpen(false);
        return;
      }

      setSlashQuery(query);
      setSlashOpen(true);

      // Position the menu near the cursor
      const domSelection = window.getSelection();
      if (domSelection && domSelection.rangeCount > 0) {
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = contentRef.current?.getBoundingClientRect();
        if (containerRect) {
          setSlashPos({
            top: rect.bottom - containerRect.top + 4,
            left: rect.left - containerRect.left,
          });
        }
      }
    } catch {
      setSlashOpen(false);
    }
  }

  function handleSlashSelect(command: SlashCommand) {
    const editor = editorRef.current;
    setSlashOpen(false);

    // Delete the slash + query text
    const { selection } = editor;
    if (selection) {
      const [node] = editor.api.node(selection.anchor.path) ?? [];
      if (node && typeof node === "object" && "text" in node) {
        const text = (node as { text: string }).text;
        const offset = selection.anchor.offset;
        const beforeCursor = text.slice(0, offset);
        const slashIdx = beforeCursor.lastIndexOf("/");
        if (slashIdx !== -1) {
          editor.tf.delete({
            at: {
              anchor: { path: selection.anchor.path, offset: slashIdx },
              focus: { path: selection.anchor.path, offset: offset },
            },
          });
        }
      }
    }

    if (command.key === "image") {
      openImagePicker();
      return;
    }

    if (command.key === "hr") {
      editor.tf.insertNodes({
        type: "hr",
        children: [{ text: "" }],
      });
      return;
    }

    // Block transforms
    editor.tf.toggleBlock(command.key);
    editor.tf.focus();
    handleChange();
  }

  function openImagePicker() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) insertImageFromFile(file);
    };
    input.click();
  }

  async function insertImageFromFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Kun bilder er tillatt");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Filen er for stor. Maks 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadNoteImage(file, tileId, section.id);
      editorRef.current.tf.insertNodes({
        type: "img",
        url,
        alt: "",
        align: "inline",
        width: 100,
        children: [{ text: "" }],
      });
      handleChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    e.preventDefault();
    files.forEach(insertImageFromFile);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    e.preventDefault();
    e.stopPropagation();
    files.forEach((f) => insertImageFromFile(f));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (slashOpen && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      // Let the SlashMenu handle these
      return;
    }
    if (e.key === "Escape" && slashOpen) {
      setSlashOpen(false);
    }
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

      {/* Upload indicator */}
      {uploading && (
        <div className="w-full h-32 rounded-md border border-dashed border-border/60 flex items-center justify-center bg-muted/20 my-2">
          <div className="flex items-center gap-2 text-muted-foreground/50">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Laster opp bilde...</span>
          </div>
        </div>
      )}

      {/* Plate editor */}
      <div className="relative" ref={contentRef}>
        <EditorContextProvider tileId={tileId} sectionId={section.id}>
        <Plate editor={editorRef.current} onChange={handleChange}>
          <PlateContent
            onDrop={handleDrop}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="min-h-[300px] outline-none text-[17px] leading-[1.65] [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-muted/50 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_hr]:border-border [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border/30 [&_img]:my-4"
            placeholder="Start typing, or press / for commands"
          />
        </Plate>
        </EditorContextProvider>

        {/* Slash command menu */}
        {slashOpen && slashPos && (
          <div style={{ position: "absolute", top: slashPos.top, left: slashPos.left }}>
            <SlashMenu query={slashQuery} onSelect={handleSlashSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
