"use client";

import { useState, useRef, useCallback } from "react";
import { useEditorRef } from "@udecode/plate/react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Replace,
  Type,
} from "lucide-react";
import { uploadNoteImage, deleteNoteImage } from "@/lib/storage";
import { useEditorContext } from "@/components/tile/editor-context";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InlineImage({ attributes, children, element }: any) {
  const url = element.url as string;
  const alt = (element.alt as string) ?? "";
  const align = (element.align as "left" | "right" | "inline") ?? "inline";
  const widthPct = (element.width as number) ?? 100;

  const [selected, setSelected] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const [altText, setAltText] = useState(alt);
  const [localWidth, setLocalWidth] = useState(widthPct);
  const imgRef = useRef<HTMLDivElement>(null);
  const editor = useEditorRef();
  const { tileId, sectionId } = useEditorContext();

  function updateNode(props: Record<string, unknown>) {
    const path = editor.api.findPath(element);
    if (path) {
      editor.tf.setNodes(props, { at: path });
    }
  }

  function handleAlign(newAlign: "left" | "right" | "inline") {
    let newWidth = localWidth;
    if (newAlign !== "inline" && newWidth === 100) newWidth = 50;
    if (newAlign === "inline") newWidth = 100;
    setLocalWidth(newWidth);
    updateNode({ align: newAlign, width: newWidth });
  }

  function handleDelete() {
    const path = editor.api.findPath(element);
    if (path) {
      editor.tf.removeNodes({ at: path });
    }
    deleteNoteImage(url);
  }

  async function handleReplace() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const { url: newUrl } = await uploadNoteImage(file, tileId, sectionId);
        updateNode({ url: newUrl });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Opplasting feilet");
      }
    };
    input.click();
  }

  function handleAltSave() {
    updateNode({ alt: altText });
    setShowAltInput(false);
  }

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const container = imgRef.current?.parentElement;
      if (!container) return;
      const containerWidth = container.getBoundingClientRect().width;
      const startWidthPx = imgRef.current?.getBoundingClientRect().width ?? containerWidth;
      const snaps = [25, 33, 50, 66, 100];

      function onMove(ev: MouseEvent) {
        const delta = ev.clientX - startX;
        const newPx = Math.max(80, startWidthPx + delta);
        let pct = Math.round((newPx / containerWidth) * 100);
        pct = Math.min(100, Math.max(10, pct));

        for (const snap of snaps) {
          if (Math.abs(pct - snap) <= 4) {
            pct = snap;
            break;
          }
        }
        setLocalWidth(pct);
      }

      function onUp() {
        updateNode({ width: localWidth });
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [localWidth, editor, element]
  );

  const floatClass =
    align === "left"
      ? "float-left mr-4 mb-3"
      : align === "right"
        ? "float-right ml-4 mb-3"
        : "block";

  return (
    <div {...attributes}>
      <div
        ref={imgRef}
        contentEditable={false}
        className={`relative group my-4 ${floatClass} max-sm:!float-none max-sm:!mx-auto max-sm:!w-full`}
        style={{ width: `${localWidth}%` }}
        onClick={() => setSelected(true)}
        onBlur={() => setSelected(false)}
        tabIndex={-1}
      >
        <img
          src={url}
          alt={altText}
          className={`w-full rounded-md border transition-shadow ${
            selected ? "border-primary ring-2 ring-primary/30" : "border-border/30"
          }`}
          draggable={false}
        />

        {/* Resize handle — desktop only */}
        {selected && (
          <div
            className="absolute bottom-1 right-1 w-4 h-4 bg-primary/80 rounded-sm cursor-nwse-resize hidden sm:flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-white/70" />
          </div>
        )}

        {/* Floating toolbar */}
        {selected && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-card border border-border shadow-lg z-20">
            <ImgBtn active={align === "left"} onClick={() => handleAlign("left")} title="Flyt venstre">
              <AlignLeft className="w-3.5 h-3.5" />
            </ImgBtn>
            <ImgBtn active={align === "inline"} onClick={() => handleAlign("inline")} title="Inline">
              <AlignCenter className="w-3.5 h-3.5" />
            </ImgBtn>
            <ImgBtn active={align === "right"} onClick={() => handleAlign("right")} title="Flyt høyre">
              <AlignRight className="w-3.5 h-3.5" />
            </ImgBtn>
            <div className="w-px h-4 bg-border mx-0.5" />
            <ImgBtn onClick={() => setShowAltInput(true)} title="Alt tekst">
              <Type className="w-3.5 h-3.5" />
            </ImgBtn>
            <ImgBtn onClick={handleReplace} title="Erstatt">
              <Replace className="w-3.5 h-3.5" />
            </ImgBtn>
            <ImgBtn onClick={handleDelete} title="Slett" destructive>
              <Trash2 className="w-3.5 h-3.5" />
            </ImgBtn>
          </div>
        )}

        {/* Alt text input */}
        {showAltInput && (
          <div className="absolute -bottom-12 left-0 flex gap-1 p-1.5 rounded-md bg-card border border-border shadow-lg z-20">
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt tekst..."
              className="text-xs bg-transparent outline-none w-40"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAltSave();
                if (e.key === "Escape") setShowAltInput(false);
              }}
            />
            <button onClick={handleAltSave} className="text-xs text-primary hover:underline">
              OK
            </button>
          </div>
        )}

        {/* Width indicator while resizing */}
        {selected && localWidth !== 100 && (
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-card/80 border border-border text-[10px] text-muted-foreground">
            {localWidth}%
          </div>
        )}
      </div>
      {/* Clearfix for floated images */}
      {align !== "inline" && <div className="clear-both" />}
      {children}
    </div>
  );
}

function ImgBtn({
  children,
  active,
  onClick,
  title,
  destructive,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
  destructive?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1 rounded transition-colors ${
        destructive
          ? "text-muted-foreground hover:text-destructive"
          : active
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </button>
  );
}
