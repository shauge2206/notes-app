"use client";

import { useState } from "react";
import { useEditorRef } from "@udecode/plate/react";
import { Plus, Minus, Trash2, ArrowDown, ArrowRight } from "lucide-react";

export function TableToolbar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any;

  function addRow() {
    editor.tf.insert.tableRow();
  }

  function addColumn() {
    editor.tf.insert.tableColumn();
  }

  function deleteRow() {
    editor.tf.remove.tableRow();
  }

  function deleteColumn() {
    editor.tf.remove.tableColumn();
  }

  function deleteTable() {
    editor.tf.remove.table();
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border border-border rounded-lg bg-card shadow-lg">
      <TBtn onClick={addRow} title="Legg til rad">
        <ArrowDown className="w-3.5 h-3.5" />
        <Plus className="w-2.5 h-2.5 -ml-1" />
      </TBtn>
      <TBtn onClick={addColumn} title="Legg til kolonne">
        <ArrowRight className="w-3.5 h-3.5" />
        <Plus className="w-2.5 h-2.5 -ml-1" />
      </TBtn>

      <div className="w-px h-4 bg-border mx-0.5" />

      <TBtn onClick={deleteRow} title="Slett rad" destructive>
        <ArrowDown className="w-3.5 h-3.5" />
        <Minus className="w-2.5 h-2.5 -ml-1" />
      </TBtn>
      <TBtn onClick={deleteColumn} title="Slett kolonne" destructive>
        <ArrowRight className="w-3.5 h-3.5" />
        <Minus className="w-2.5 h-2.5 -ml-1" />
      </TBtn>

      <div className="w-px h-4 bg-border mx-0.5" />

      <TBtn onClick={deleteTable} title="Slett tabell" destructive>
        <Trash2 className="w-3.5 h-3.5" />
      </TBtn>
    </div>
  );
}

function TBtn({ children, onClick, title, destructive }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  destructive?: boolean;
}) {
  return (
    <span
      role="button"
      tabIndex={-1}
      title={title}
      aria-label={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-1.5 rounded transition-colors cursor-pointer select-none ${
        destructive
          ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </span>
  );
}

// Grid size picker for inserting tables
export function TableSizePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const maxRows = 6;
  const maxCols = 6;

  return (
    <div className="p-2">
      <p className="text-xs text-muted-foreground mb-2">
        {hoverRow > 0 ? `${hoverRow} × ${hoverCol}` : "Velg størrelse"}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
        {Array.from({ length: maxRows * maxCols }).map((_, i) => {
          const row = Math.floor(i / maxCols) + 1;
          const col = (i % maxCols) + 1;
          const isActive = row <= hoverRow && col <= hoverCol;
          return (
            <span
              key={i}
              className={`w-5 h-5 rounded-sm border transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/30 border-primary/50"
                  : "bg-muted/30 border-border/50 hover:border-border"
              }`}
              onMouseEnter={() => { setHoverRow(row); setHoverCol(col); }}
              onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(row, col);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
