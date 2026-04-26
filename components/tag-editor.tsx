"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function TagEditor({ tags, onChange, suggestions = [], placeholder = "Legg til tag..." }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(s)
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [input]);

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSuggestions && filtered[activeIdx]) {
        addTag(filtered[activeIdx]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setEditing(false);
      setShowSuggestions(false);
    } else if (e.key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs gap-1 pl-2 pr-1 py-0.5"
        >
          #{tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:text-destructive transition-colors ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      {editing ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(e.target.value.length > 0 && filtered.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setEditing(false);
                setShowSuggestions(false);
                if (input.trim()) addTag(input);
              }, 150);
            }}
            autoFocus
            placeholder={placeholder}
            className="text-xs bg-transparent outline-none w-24 min-w-0"
          />

          {showSuggestions && filtered.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 w-40 rounded-md border border-border bg-card shadow-lg py-1 max-h-32 overflow-y-auto">
              {filtered.slice(0, 8).map((s, i) => (
                <button
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(s);
                  }}
                  className={`w-full text-left px-2.5 py-1 text-xs transition-colors ${
                    i === activeIdx ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`}
                >
                  #{s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          + tag
        </button>
      )}
    </div>
  );
}
