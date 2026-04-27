"use client";

import type { PlateLeafProps, PlateElementProps } from "@udecode/plate/react";
import { PlateLeaf, PlateElement, useEditorRef } from "@udecode/plate/react";
import { Transforms, Editor } from "slate";
import { X } from "lucide-react";

// Mark leaf components
export function BoldLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="strong" />;
}
export function ItalicLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="em" />;
}
export function UnderlineLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="u" />;
}
export function StrikethroughLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="s" />;
}
export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="bg-white/10 px-1 py-0.5 rounded font-mono text-sm"
    />
  );
}

export function SuperscriptLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="sup" />;
}
export function SubscriptLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="sub" />;
}

// Link component
export function LinkElement(props: PlateElementProps) {
  const el = props.element as { url?: string };
  return (
    <PlateElement
      {...props}
      as="a"
      className="text-primary underline underline-offset-2 hover:text-primary/80 cursor-pointer"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ href: el.url, target: "_blank", rel: "noopener noreferrer" } as any)}
    />
  );
}

// Todo list component
export function TodoListElement(props: PlateElementProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = props.element as any;
  const checked = !!el.checked;
  const editor = useEditorRef();

  function toggle() {
    const path = editor.api.findPath(props.element);
    if (path) {
      editor.tf.setNodes({ checked: !checked }, { at: path });
    }
  }

  return (
    <PlateElement {...props} as="div" className="flex items-start gap-2.5 my-1.5">
      <span
        contentEditable={false}
        onClick={toggle}
        className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
          checked
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary/60"
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={`flex-1 ${checked ? "line-through text-muted-foreground/40" : ""}`}>
        {props.children}
      </span>
    </PlateElement>
  );
}

// Block element components
export function HeadingElement(props: PlateElementProps) {
  const level = (props.element as { type: string }).type;
  const tag = level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const styles: Record<string, string> = {
    h1: "text-2xl font-bold mt-6 mb-2",
    h2: "text-xl font-semibold mt-5 mb-2",
    h3: "text-lg font-semibold mt-4 mb-1",
    h4: "text-base font-semibold mt-3 mb-1",
    h5: "text-sm font-semibold mt-2 mb-1",
    h6: "text-sm font-medium mt-2 mb-1",
  };
  return <PlateElement {...props} as={tag} className={styles[tag] ?? ""} />;
}

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="blockquote"
      className="border-l-2 border-white/20 pl-4 italic text-white/60 my-2"
    />
  );
}

export function BulletedListElement(props: PlateElementProps) {
  return <PlateElement {...props} as="ul" className="list-disc pl-6 my-2" />;
}

export function NumberedListElement(props: PlateElementProps) {
  return <PlateElement {...props} as="ol" className="list-decimal pl-6 my-2" />;
}

export function ListItemElement(props: PlateElementProps) {
  return <PlateElement {...props} as="li" className="my-0.5" />;
}

export function ListItemContentElement(props: PlateElementProps) {
  return <PlateElement {...props} as="span" />;
}

export function CodeBlockElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="pre"
      className="bg-white/5 rounded-lg p-4 font-mono text-sm my-4"
    />
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} as="div" />;
}

export function HrElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <hr className="border-white/10 my-4" />
      {props.children}
    </PlateElement>
  );
}

export function ParagraphElement(props: PlateElementProps) {
  return <PlateElement {...props} as="p" className="my-1" />;
}

// Table components
export function TableElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} as="div" className="my-4 mt-8 relative ml-6 overflow-visible">
      <table className="w-full border-collapse table-fixed overflow-visible">
        {props.children}
      </table>
    </PlateElement>
  );
}

export function TableRowElement(props: PlateElementProps) {
  const editor = useEditorRef();

  function deleteRow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const path = editor.api.findPath(props.element);
    if (path) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Transforms.removeNodes(editor as any, { at: path });
    }
  }

  return (
    <PlateElement {...props} as="tr" className="group/row relative overflow-visible">
      {props.children}
      {/* Row delete — outside left of table */}
      <td className="!p-0 !border-0 !w-0 !min-w-0" contentEditable={false}>
        <button
          onMouseDown={deleteRow}
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-50 hover:!opacity-100 transition-opacity p-0.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive/50 hover:text-destructive"
          title="Slett rad"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </td>
    </PlateElement>
  );
}

export function TableCellElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="td"
      className="border border-white/10 px-2 py-1.5 text-sm align-top break-words max-w-0"
    >
      {props.children}
    </PlateElement>
  );
}

export function TableHeaderCellElement(props: PlateElementProps) {
  const editor = useEditorRef();

  function deleteColumn(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const cellPath = editor.api.findPath(props.element);
    console.log("[deleteCol] cellPath:", cellPath);
    if (!cellPath || cellPath.length < 2) return;

    const colIndex = cellPath[cellPath.length - 1];
    const tablePath = cellPath.slice(0, -2);
    console.log("[deleteCol] colIndex:", colIndex, "tablePath:", tablePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tableNode: any = { children: editor.children };
    for (const idx of tablePath) {
      tableNode = tableNode?.children?.[idx];
    }
    console.log("[deleteCol] tableNode type:", tableNode?.type, "rows:", tableNode?.children?.length);
    if (!tableNode?.children) return;

    // Log each row's column count
    tableNode.children.forEach((row: { children?: unknown[] }, i: number) => {
      console.log("[deleteCol] row", i, "cols:", row.children?.length);
    });

    const rowCount = tableNode.children.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ed = editor as any;

    Editor.withoutNormalizing(ed, () => {
      for (let r = rowCount - 1; r >= 0; r--) {
        const path = [...tablePath, r, colIndex];
        console.log("[deleteCol] removing at:", path);
        Transforms.removeNodes(ed, { at: path });
      }
    });
  }

  return (
    <PlateElement
      {...props}
      as="th"
      className="border border-white/10 bg-white/5 px-2 py-1.5 text-sm font-semibold text-left align-top break-words max-w-0 relative group/cell overflow-visible"
    >
      {props.children}
      <button
        contentEditable={false}
        onMouseDown={deleteColumn}
        className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/cell:opacity-50 hover:!opacity-100 transition-opacity p-0.5 rounded bg-destructive/10 hover:bg-destructive/20 text-destructive/50 hover:text-destructive"
        title="Slett kolonne"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </PlateElement>
  );
}
