"use client";

import { useState, useEffect, useRef } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  ImageIcon,
  Table,
} from "lucide-react";

export interface SlashCommand {
  key: string;
  label: string;
  icon: React.ReactNode;
  keywords?: string[];
}

const COMMANDS: SlashCommand[] = [
  { key: "p", label: "Paragraph", icon: <Type className="w-4 h-4" />, keywords: ["text", "paragraph"] },
  { key: "h1", label: "Heading 1", icon: <Heading1 className="w-4 h-4" />, keywords: ["heading", "title"] },
  { key: "h2", label: "Heading 2", icon: <Heading2 className="w-4 h-4" />, keywords: ["heading", "subtitle"] },
  { key: "h3", label: "Heading 3", icon: <Heading3 className="w-4 h-4" />, keywords: ["heading"] },
  { key: "ul", label: "Bulleted List", icon: <List className="w-4 h-4" />, keywords: ["list", "bullet", "unordered"] },
  { key: "ol", label: "Numbered List", icon: <ListOrdered className="w-4 h-4" />, keywords: ["list", "number", "ordered"] },
  { key: "todo", label: "Todo List", icon: <CheckSquare className="w-4 h-4" />, keywords: ["todo", "check", "task"] },
  { key: "blockquote", label: "Quote", icon: <Quote className="w-4 h-4" />, keywords: ["quote", "blockquote"] },
  { key: "code_block", label: "Code Block", icon: <Code className="w-4 h-4" />, keywords: ["code", "snippet"] },
  { key: "hr", label: "Divider", icon: <Minus className="w-4 h-4" />, keywords: ["divider", "line", "separator"] },
  { key: "table", label: "Table", icon: <Table className="w-4 h-4" />, keywords: ["table", "grid", "spreadsheet", "excel"] },
  { key: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" />, keywords: ["image", "photo", "picture", "upload"] },
];

interface Props {
  query: string;
  onSelect: (command: SlashCommand) => void;
}

export function SlashMenu({ query, onSelect }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.key.includes(q) ||
      cmd.keywords?.some((kw) => kw.includes(q))
    );
  });

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex]);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered, activeIndex, onSelect]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-56 rounded-lg border border-border bg-card shadow-xl py-1 max-h-72 overflow-y-auto"
    >
      {filtered.map((cmd, i) => (
        <button
          key={cmd.key}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd);
          }}
          onMouseEnter={() => setActiveIndex(i)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
            i === activeIndex
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {cmd.icon}
          {cmd.label}
        </button>
      ))}
    </div>
  );
}
