"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorValue = any;
import { Transforms as SlateTransforms } from "slate";
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin, SuperscriptPlugin, SubscriptPlugin } from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin, CodeLinePlugin } from "@udecode/plate-code-block/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { ListPlugin, TodoListPlugin } from "@udecode/plate-list/react";
import { ImagePlugin } from "@udecode/plate-media/react";
import { TablePlugin } from "@udecode/plate-table/react";
import { FontColorPlugin } from "@udecode/plate-font/react";
import {
  BoldLeaf, ItalicLeaf, UnderlineLeaf, StrikethroughLeaf, CodeLeaf,
  SuperscriptLeaf, SubscriptLeaf,
  HeadingElement, BlockquoteElement, LinkElement, TodoListElement,
  BulletedListElement, NumberedListElement, ListItemElement, ListItemContentElement,
  CodeBlockElement, CodeLineElement, HrElement, ParagraphElement,
  TableElement, TableRowElement, TableCellElement, TableHeaderCellElement,
} from "@/lib/plate-components";
import { toast } from "sonner";
import { saveSectionContent, renameSection } from "@/app/actions/sections";
import { uploadNoteImage, deleteNoteImage } from "@/lib/storage";
import { InlineImage } from "@/components/tile/editor-image";
import { createPortal } from "react-dom";
import { EditorToolbar } from "@/components/tile/editor-toolbar";
import { FloatingTableToolbar } from "@/components/tile/floating-table-toolbar";
import { SlashMenu, type SlashCommand } from "@/components/tile/slash-menu";
import { EditorContextProvider } from "@/components/tile/editor-context";
import type { Section } from "@/lib/types";

interface Props {
  section: Section;
  tileId: string;
  onSaveStateChange?: (saving: boolean) => void;
  flushRef?: React.MutableRefObject<(() => Promise<void>) | null>;
  toolbarPortal?: React.RefObject<HTMLDivElement | null>;
}

const defaultValue: EditorValue = [{ type: "h1", children: [{ text: "" }] }];

export function SectionEditor({ section, tileId, onSaveStateChange, flushRef, toolbarPortal }: Props) {
  const [uploading, setUploading] = useState(false);
  const lastTitleRef = useRef(section.title);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastImageUrls = useRef<Set<string>>(new Set());

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      SuperscriptPlugin,
      SubscriptPlugin,
      HeadingPlugin,
      BlockquotePlugin,
      CodeBlockPlugin,
      CodeLinePlugin,
      HorizontalRulePlugin,
      LinkPlugin,
      ListPlugin,
      TodoListPlugin,
      TablePlugin,
      FontColorPlugin,
      ImagePlugin.configure({
        render: {
          node: InlineImage,
        },
        options: {
          disableUploadInsert: true,
        },
        handlers: {},
      }),
    ],
    override: {
      components: {
        [BoldPlugin.key]: BoldLeaf,
        [ItalicPlugin.key]: ItalicLeaf,
        [UnderlinePlugin.key]: UnderlineLeaf,
        [StrikethroughPlugin.key]: StrikethroughLeaf,
        [CodePlugin.key]: CodeLeaf,
        [SuperscriptPlugin.key]: SuperscriptLeaf,
        [SubscriptPlugin.key]: SubscriptLeaf,
        p: ParagraphElement,
        a: LinkElement,
        h1: HeadingElement,
        h2: HeadingElement,
        h3: HeadingElement,
        h4: HeadingElement,
        h5: HeadingElement,
        h6: HeadingElement,
        blockquote: BlockquoteElement,
        ul: BulletedListElement,
        ol: NumberedListElement,
        li: ListItemElement,
        lic: ListItemContentElement,
        action_item: TodoListElement,
        code_block: CodeBlockElement,
        code_line: CodeLineElement,
        hr: HrElement,
        table: TableElement,
        tr: TableRowElement,
        td: TableCellElement,
        th: TableHeaderCellElement,
      },
    },
    value: (section.content as EditorValue) ?? defaultValue,
  }, [section.id]);

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

  // Reset local state when section changes
  useEffect(() => {
    const val = (section.content as EditorValue) ?? defaultValue;
    lastImageUrls.current = extractImageUrls(val);
    lastTitleRef.current = section.title;
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
    const content = editor.children;
    const plainText = editor.api.string([]);

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
    // Flush on unmount to prevent data loss
    return () => {
      if (flushRef) flushRef.current = null;
      if (pendingRef.current) save();
    };
  }, [save, flushRef]);

  function handleChange() {
    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 60000);

    // Sync section title with first line of content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstNode = editor.children[0] as any;
    if (firstNode) {
      const firstText = firstNode.children?.map((c: { text?: string }) => c.text ?? "").join("").trim() ?? "";
      if (firstText && firstText !== lastTitleRef.current) {
        lastTitleRef.current = firstText;
        renameSection(section.id, firstText);
      }
    }

    // Detect slash command
    detectSlash();
  }

  function detectSlash() {
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

    if (command.key === "table") {
      editor.tf.insertNodes({
        type: "table",
        children: [
          {
            type: "tr",
            children: [
              { type: "th", children: [{ text: "" }] },
              { type: "th", children: [{ text: "" }] },
              { type: "th", children: [{ text: "" }] },
            ],
          },
          {
            type: "tr",
            children: [
              { type: "td", children: [{ text: "" }] },
              { type: "td", children: [{ text: "" }] },
              { type: "td", children: [{ text: "" }] },
            ],
          },
          {
            type: "tr",
            children: [
              { type: "td", children: [{ text: "" }] },
              { type: "td", children: [{ text: "" }] },
              { type: "td", children: [{ text: "" }] },
            ],
          },
        ],
      });
      handleChange();
      return;
    }

    // List toggles need special API
    if (command.key === "ul") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor.tf as any).toggle.bulletedList();
      handleChange();
      return;
    }
    if (command.key === "ol") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (editor.tf as any).toggle.numberedList();
      handleChange();
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
      editor.tf.insertNodes({
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
    // Handle image paste
    const files = Array.from(e.clipboardData.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      files.forEach((f) => insertImageFromFile(f));
      return;
    }

    // Handle multi-line paste inside code blocks
    if (editor.selection) {
      const path = editor.selection.anchor.path;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let node: any = { children: editor.children };
      let inCodeBlock = false;
      for (let i = 0; i < path.length; i++) {
        node = node?.children?.[path[i]];
        if (node?.type === "code_block") { inCodeBlock = true; break; }
      }

      if (inCodeBlock) {
        const text = e.clipboardData.getData("text/plain");
        if (text) {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          document.execCommand("insertText", false, text);
          return;
        }
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (slashOpen && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      return;
    }
    if (e.key === "Escape" && slashOpen) {
      setSlashOpen(false);
      return;
    }
    // Escape exits block elements
    if (e.key === "Escape" && !slashOpen && editor.selection) {
      const path = editor.selection.anchor.path;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let block: any = { children: editor.children };
      let blockPath: number[] = [];
      for (let i = 0; i < path.length; i++) {
        block = block?.children?.[path[i]];
        if (block?.type === "action_item" || block?.type === "blockquote") {
          e.preventDefault();
          editor.tf.setNodes({ type: "p" });
          return;
        }
        if (block?.type === "code_block" || block?.type === "table") {
          blockPath = path.slice(0, i + 1);
          break;
        }
      }
      // For code blocks and tables — move cursor after, insert paragraph if needed
      if (blockPath.length > 0) {
        e.preventDefault();
        const blockIdx = blockPath[blockPath.length - 1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parentChildren = (editor as any).children;
        if (blockIdx >= parentChildren.length - 1) {
          editor.tf.insertNodes(
            { type: "p", children: [{ text: "" }] },
            { at: [blockIdx + 1] }
          );
        }
        editor.tf.select([blockIdx + 1, 0]);
        return;
      }
    }
    // After pressing Enter on a heading, reset to paragraph
    if (e.key === "Enter" && !e.shiftKey && editor.selection) {
      const path = editor.selection.anchor.path;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentNode: any = { children: editor.children };
      for (let i = 0; i < path.length; i++) {
        currentNode = currentNode?.children?.[path[i]];
      }
      // Walk up to find the block
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let block: any = { children: editor.children };
      for (let i = 0; i < path.length - 1; i++) {
        block = block?.children?.[path[i]];
      }
      const blockType = block?.type;
      if (blockType && /^h[1-6]$/.test(blockType)) {
        // Let Slate handle the Enter (split the node), then convert the new block to paragraph
        setTimeout(() => {
          editor.tf.setNodes({ type: "p" });
        }, 0);
      }
    }

    // Table keyboard navigation
    if (editor.selection) {
      const path = editor.selection.anchor.path;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tableInfo: { tablePath: number[]; tableNode: any } | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let node: any = { children: editor.children };
      for (let i = 0; i < path.length; i++) {
        node = node?.children?.[path[i]];
        if (node?.type === "table") {
          tableInfo = { tablePath: path.slice(0, i + 1), tableNode: node };
          break;
        }
      }

      if (tableInfo) {
        // Tab — move between cells
        if (e.key === "Tab") {
          e.preventDefault();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (editor as any).tf.move({ unit: "offset", reverse: e.shiftKey });
        }

        // Escape — move cursor after the table
        if (e.key === "Escape") {
          e.preventDefault();
          const afterTablePath = [...tableInfo.tablePath.slice(0, -1), tableInfo.tablePath[tableInfo.tablePath.length - 1] + 1];
          // Ensure there's a paragraph after the table
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parentChildren = (editor as any).children;
          const tableIdx = tableInfo.tablePath[0];
          if (tableIdx >= parentChildren.length - 1 || parentChildren[tableIdx + 1]?.type === "table") {
            editor.tf.insertNodes(
              { type: "p", children: [{ text: "" }] },
              { at: [tableIdx + 1] }
            );
          }
          editor.tf.select([tableIdx + 1, 0]);
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">

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
        <Plate
          editor={editor}
          onValueChange={({ value }) => {
            handleChange();
          }}
        >
          <PlateContent
            onDrop={handleDrop}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="min-h-[300px] outline-none text-[17px] leading-[1.65] [&_a]:text-primary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_img]:border-border/30 [&_img]:my-4"
            placeholder="Start typing, or press / for commands"
          />

          {/* Toolbar — portaled to the toolbar slot in the parent */}
          {toolbarPortal?.current && createPortal(
            <div className="flex items-center gap-1 flex-wrap">
              <EditorToolbar onInsertImage={openImagePicker} />
              <FloatingTableToolbar />
            </div>,
            toolbarPortal.current
          )}
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
