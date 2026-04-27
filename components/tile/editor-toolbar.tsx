"use client";

import { useState } from "react";
import {
  useEditorRef,
  useMarkToolbarButtonState,
} from "@udecode/plate/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  SuperscriptPlugin,
  SubscriptPlugin,
} from "@udecode/plate-basic-marks/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  Minus,
  Link,
  ImageIcon,
  Palette,
  Superscript,
  Subscript,
  CodeSquare,
} from "lucide-react";

function MarkButton({ nodeType, children, title }: { nodeType: string; children: React.ReactNode; title: string }) {
  const editor = useEditorRef();
  const state = useMarkToolbarButtonState({ nodeType });

  return (
    <span
      role="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      aria-pressed={state.pressed}
      onMouseDown={(e) => {
        e.preventDefault();
        editor.tf.toggleMark(nodeType, { remove: state.clear });
      }}
      className={`p-1.5 rounded transition-colors cursor-pointer select-none flex items-center justify-center ${
        state.pressed
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </span>
  );
}

function BlockButton({ type, children, title }: { type: string; children: React.ReactNode; title: string }) {
  const editor = useEditorRef();

  return (
    <span
      role="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        editor.tf.toggleBlock(type);
      }}
      className="p-1.5 rounded transition-colors text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 cursor-pointer select-none flex items-center justify-center"
    >
      {children}
    </span>
  );
}

function ListButton({ listType, children, title }: { listType: "bulletedList" | "numberedList"; children: React.ReactNode; title: string }) {
  const editor = useEditorRef();

  return (
    <span
      role="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor.tf as any).toggle[listType]();
      }}
      className="p-1.5 rounded transition-colors text-muted-foreground/60 hover:text-foreground hover:bg-accent/50 cursor-pointer select-none flex items-center justify-center"
    >
      {children}
    </span>
  );
}

function ActionButton({ onAction, children, title, active }: { onAction: () => void; children: React.ReactNode; title: string; active?: boolean }) {
  return (
    <span
      role="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
      className={`p-1.5 rounded transition-colors cursor-pointer select-none flex items-center justify-center ${
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </span>
  );
}

function Sep() {
  return <div className="col-span-2 h-px bg-border/50 my-0.5" />;
}

interface ToolbarProps {
  onInsertImage?: () => void;
}

export function EditorToolbar({ onInsertImage }: ToolbarProps) {
  const editor = useEditorRef();
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  function insertTable(rows: number, cols: number) {
    const headerRow = {
      type: "tr",
      children: Array.from({ length: cols }, () => ({
        type: "th",
        children: [{ text: "" }],
      })),
    };
    const dataRows = Array.from({ length: rows - 1 }, () => ({
      type: "tr",
      children: Array.from({ length: cols }, () => ({
        type: "td",
        children: [{ text: "" }],
      })),
    }));
    editor.tf.insertNodes({
      type: "table",
      children: [headerRow, ...dataRows],
    });
    setShowTablePicker(false);
  }

  function insertLink() {
    if (!linkUrl.trim()) return;
    editor.tf.insertNodes({
      type: "a",
      url: linkUrl.trim(),
      children: [{ text: linkUrl.trim() }],
    });
    setLinkUrl("");
    setShowLinkInput(false);
  }

  function applyColor(color: string) {
    editor.tf.toggleMark("color");
    if (color !== "default") {
      editor.tf.addMark("color", color);
    }
    setShowColorPicker(false);
  }

  const COLORS = [
    { label: "Standard", value: "default", class: "bg-foreground" },
    { label: "Rød", value: "#EF4444", class: "bg-red-500" },
    { label: "Oransje", value: "#F97316", class: "bg-orange-500" },
    { label: "Gul", value: "#EAB308", class: "bg-yellow-500" },
    { label: "Grønn", value: "#22C55E", class: "bg-green-500" },
    { label: "Blå", value: "#3B82F6", class: "bg-blue-500" },
    { label: "Lilla", value: "#8B5CF6", class: "bg-violet-500" },
    { label: "Rosa", value: "#EC4899", class: "bg-pink-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-0.5 py-2 px-1 border border-border rounded-lg bg-card/80 backdrop-blur-sm shadow-sm w-[4.5rem]">
      {/* Marks */}
      <MarkButton nodeType={BoldPlugin.key} title="Bold (⌘B)">
        <Bold className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={ItalicPlugin.key} title="Italic (⌘I)">
        <Italic className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={UnderlinePlugin.key} title="Underline (⌘U)">
        <Underline className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={StrikethroughPlugin.key} title="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={CodePlugin.key} title="Inline code">
        <Code className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={SuperscriptPlugin.key} title="Superscript">
        <Superscript className="w-3.5 h-3.5" />
      </MarkButton>
      <MarkButton nodeType={SubscriptPlugin.key} title="Subscript">
        <Subscript className="w-3.5 h-3.5" />
      </MarkButton>

      <Sep />

      {/* Text color */}
      <div className="relative col-span-2">
        <ActionButton
          title="Tekstfarge"
          active={showColorPicker}
          onAction={() => setShowColorPicker((v) => !v)}
        >
          <Palette className="w-3.5 h-3.5" />
        </ActionButton>
        {showColorPicker && (
          <div className="absolute right-0 top-full mt-1 z-50 p-2 border border-border rounded-lg bg-card shadow-xl w-max">
            <div className="flex gap-1.5 flex-wrap max-w-[120px]">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor(c.value);
                  }}
                  className={`w-5 h-5 rounded-full ${c.class} border border-white/20 hover:scale-110 transition-transform`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Sep />

      {/* Headings */}
      <BlockButton type="h1" title="Heading 1">
        <Heading1 className="w-3.5 h-3.5" />
      </BlockButton>
      <BlockButton type="h2" title="Heading 2">
        <Heading2 className="w-3.5 h-3.5" />
      </BlockButton>
      <BlockButton type="h3" title="Heading 3">
        <Heading3 className="w-3.5 h-3.5" />
      </BlockButton>

      <Sep />

      {/* Lists & blocks */}
      <BlockButton type="blockquote" title="Quote">
        <Quote className="w-3.5 h-3.5" />
      </BlockButton>
      <ListButton listType="bulletedList" title="Bulleted list">
        <List className="w-3.5 h-3.5" />
      </ListButton>
      <ListButton listType="numberedList" title="Numbered list">
        <ListOrdered className="w-3.5 h-3.5" />
      </ListButton>
      <BlockButton type="action_item" title="Todo list">
        <CheckSquare className="w-3.5 h-3.5" />
      </BlockButton>

      <Sep />

      {/* Code block */}
      <ActionButton title="Code block" onAction={() => editor.tf.toggleBlock("code_block")}>
        <CodeSquare className="w-3.5 h-3.5" />
      </ActionButton>

      {/* Link */}
      <div className="relative col-span-2">
        {showLinkInput ? (
          <div className="flex items-center gap-1">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); insertLink(); }
                if (e.key === "Escape") { setShowLinkInput(false); setLinkUrl(""); }
              }}
              placeholder="URL..."
              autoFocus
              className="w-full text-[10px] bg-transparent border border-border rounded px-1.5 py-1 outline-none focus:border-primary"
            />
          </div>
        ) : (
          <ActionButton title="Link" onAction={() => setShowLinkInput(true)}>
            <Link className="w-3.5 h-3.5" />
          </ActionButton>
        )}
      </div>

      {/* Image */}
      {onInsertImage && (
        <ActionButton title="Image" onAction={onInsertImage}>
          <ImageIcon className="w-3.5 h-3.5" />
        </ActionButton>
      )}

      <Sep />

      {/* Table */}
      <div className="relative">
        <ActionButton
          title="Table"
          active={showTablePicker}
          onAction={() => setShowTablePicker((v) => !v)}
        >
          <Table className="w-3.5 h-3.5" />
        </ActionButton>
        {showTablePicker && (
          <div
            className="absolute right-full top-0 mr-2 z-50 border border-border rounded-lg bg-card shadow-xl p-2"
            onMouseLeave={() => setShowTablePicker(false)}
          >
            <TableGridPicker onSelect={insertTable} />
          </div>
        )}
      </div>

      {/* Divider */}
      <ActionButton
        title="Divider"
        onAction={() => editor.tf.insertNodes({ type: "hr", children: [{ text: "" }] })}
      >
        <Minus className="w-3.5 h-3.5" />
      </ActionButton>
    </div>
  );
}

function TableGridPicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);

  return (
    <div>
      <p className="text-[11px] text-muted-foreground mb-1.5 text-center">
        {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : "Velg størrelse"}
      </p>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {Array.from({ length: 36 }).map((_, i) => {
          const row = Math.floor(i / 6) + 1;
          const col = (i % 6) + 1;
          const isActive = row <= hoverRow && col <= hoverCol;
          return (
            <span
              key={i}
              className={`w-5 h-5 rounded-[3px] border transition-colors cursor-pointer ${
                isActive ? "bg-primary/40 border-primary/60" : "bg-muted/20 border-border/40"
              }`}
              onMouseEnter={() => { setHoverRow(row); setHoverCol(col); }}
              onMouseDown={(e) => { e.preventDefault(); onSelect(row, col); }}
            />
          );
        })}
      </div>
    </div>
  );
}
