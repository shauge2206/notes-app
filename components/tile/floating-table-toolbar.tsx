"use client";

import { useEditorRef, useEditorSelector } from "@udecode/plate/react";
import { Transforms, Editor } from "slate";
import { Rows3, Columns3, Trash2 } from "lucide-react";

function getTableInfo(editor: { selection: { anchor: { path: number[] } } | null; children: unknown[] }): { inTable: boolean; cols: number; rows: number } {
  if (!editor.selection) return { inTable: false, cols: 0, rows: 0 };
  const path = editor.selection.anchor.path;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = { children: editor.children };
  for (let i = 0; i < path.length; i++) {
    node = node?.children?.[path[i]];
    if (node?.type === "table") {
      const rows = node.children?.length ?? 0;
      const cols = node.children?.[0]?.children?.length ?? 0;
      return { inTable: true, cols, rows };
    }
  }
  return { inTable: false, cols: 0, rows: 0 };
}

export function FloatingTableToolbar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useEditorRef() as any;
  const { inTable, cols } = useEditorSelector((e) => getTableInfo(e as never), []);

  if (!inTable) return null;

  function addRow() {
    // Build a full row matching column count
    const cells = Array.from({ length: cols || 1 }, () => ({
      type: "td",
      children: [{ type: "p", children: [{ text: "" }] }],
      colSpan: 1,
      rowSpan: 1,
    }));

    // Find the table path and insert at the end
    if (!editor.selection) return;
    const path = editor.selection.anchor.path;
    // Walk to find table path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = { children: editor.children };
    let tablePath: number[] = [];
    for (let i = 0; i < path.length; i++) {
      node = node?.children?.[path[i]];
      if (node?.type === "table") {
        tablePath = path.slice(0, i + 1);
        break;
      }
    }
    if (tablePath.length === 0) return;

    const tableNode = node;
    const rowCount = tableNode.children?.length ?? 0;
    editor.tf.insertNodes(
      { type: "tr", children: cells },
      { at: [...tablePath, rowCount] }
    );
  }

  function addColumn() {
    // Add a cell to every row in the table
    if (!editor.selection) return;
    const path = editor.selection.anchor.path;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = { children: editor.children };
    let tablePath: number[] = [];
    for (let i = 0; i < path.length; i++) {
      node = node?.children?.[path[i]];
      if (node?.type === "table") {
        tablePath = path.slice(0, i + 1);
        break;
      }
    }
    if (tablePath.length === 0) return;

    const tableNode = node;
    // Insert from bottom to top so paths don't shift
    for (let r = (tableNode.children?.length ?? 0) - 1; r >= 0; r--) {
      const row = tableNode.children[r];
      const colCount = row.children?.length ?? 0;
      const isHeader = r === 0;
      editor.tf.insertNodes(
        {
          type: isHeader ? "th" : "td",
          children: [{ type: "p", children: [{ text: "" }] }],
          colSpan: 1,
          rowSpan: 1,
        },
        { at: [...tablePath, r, colCount] }
      );
    }
  }

  function deleteRow() {
    if (!editor.selection) return;
    // Find the row path from current selection
    const path = editor.selection.anchor.path;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = { children: editor.children };
    let rowPath: number[] = [];
    for (let i = 0; i < path.length; i++) {
      node = node?.children?.[path[i]];
      if (node?.type === "tr") {
        rowPath = path.slice(0, i + 1);
        break;
      }
    }
    if (rowPath.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Transforms.removeNodes(editor as any, { at: rowPath });
    }
  }

  function deleteColumn() {
    if (!editor.selection) return;
    const path = editor.selection.anchor.path;

    // Find table path and current column index
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = { children: editor.children };
    let tablePath: number[] = [];
    let colIndex = -1;

    for (let i = 0; i < path.length; i++) {
      node = node?.children?.[path[i]];
      if (node?.type === "table") {
        tablePath = path.slice(0, i + 1);
      }
      if (node?.type === "td" || node?.type === "th") {
        colIndex = path[i];
      }
    }

    if (tablePath.length === 0 || colIndex < 0) return;

    // Re-read the table node
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tableNode: any = { children: editor.children };
    for (const idx of tablePath) {
      tableNode = tableNode?.children?.[idx];
    }
    if (!tableNode?.children) return;

    const rowCount = tableNode.children.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ed = editor as any;

    Editor.withoutNormalizing(ed, () => {
      for (let r = rowCount - 1; r >= 0; r--) {
        Transforms.removeNodes(ed, { at: [...tablePath, r, colIndex] });
      }
    });
  }

  function deleteTable() {
    if (!editor.selection) return;
    const path = editor.selection.anchor.path;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = { children: editor.children };
    for (let i = 0; i < path.length; i++) {
      node = node?.children?.[path[i]];
      if (node?.type === "table") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Transforms.removeNodes(editor as any, { at: path.slice(0, i + 1) });
        return;
      }
    }
  }

  return (
    <div className="flex flex-col gap-0.5 px-1 py-1.5 border border-border rounded-md bg-card shadow-md text-[10px] w-[4.5rem]">
      <TBtn onClick={addRow}>
        <Rows3 className="w-3 h-3 mr-1" />Rad
      </TBtn>
      <TBtn onClick={addColumn}>
        <Columns3 className="w-3 h-3 mr-1" />Kolonne
      </TBtn>
      <div className="h-px bg-border/50 my-0.5" />
      <TBtn onClick={deleteRow} destructive>
        Slett rad
      </TBtn>
      <TBtn onClick={deleteColumn} destructive>
        Slett kol.
      </TBtn>
      <div className="h-px bg-border/50 my-0.5" />
      <TBtn onClick={deleteTable} destructive>
        <Trash2 className="w-3 h-3 mr-1" />Tabell
      </TBtn>
    </div>
  );
}

function TBtn({ children, onClick, destructive }: {
  children: React.ReactNode; onClick: () => void; destructive?: boolean;
}) {
  return (
    <span
      role="button"
      tabIndex={-1}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center px-2 py-1 rounded transition-colors cursor-pointer select-none whitespace-nowrap ${
        destructive
          ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </span>
  );
}
