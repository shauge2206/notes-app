"use client";

import { Plate, PlateContent, usePlateEditor, useEditorRef, useMarkToolbarButtonState } from "@udecode/plate/react";
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin } from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { ListPlugin } from "@udecode/plate-list/react";
import { CodeBlockPlugin, CodeLinePlugin } from "@udecode/plate-code-block/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { TablePlugin } from "@udecode/plate-table/react";
import {
  BoldLeaf, ItalicLeaf, UnderlineLeaf, StrikethroughLeaf, CodeLeaf,
  HeadingElement, BlockquoteElement,
  BulletedListElement, NumberedListElement, ListItemElement, ListItemContentElement,
  CodeBlockElement, CodeLineElement, HrElement, ParagraphElement,
  TableElement, TableRowElement, TableCellElement, TableHeaderCellElement,
} from "@/lib/plate-components";

const initialValue = [{ type: "p", children: [{ text: "Select this text and press Cmd+B, or try the buttons." }] }];

function Toolbar() {
  const editor = useEditorRef();
  const boldState = useMarkToolbarButtonState({ nodeType: BoldPlugin.key });
  const italicState = useMarkToolbarButtonState({ nodeType: ItalicPlugin.key });

  return (
    <div className="flex gap-2 mb-3 p-2 bg-white/5 rounded flex-wrap">
      <Btn pressed={boldState.pressed} onExec={() => editor.tf.toggleMark(BoldPlugin.key)}>Bold</Btn>
      <Btn pressed={italicState.pressed} onExec={() => editor.tf.toggleMark(ItalicPlugin.key)}>Italic</Btn>
      <Btn onExec={() => editor.tf.toggleBlock("h1")}>H1</Btn>
      <Btn onExec={() => editor.tf.toggleBlock("h2")}>H2</Btn>
      <Btn onExec={() => editor.tf.toggleBlock("h3")}>H3</Btn>
      <Btn onExec={() => editor.tf.toggleBlock("blockquote")}>Quote</Btn>
      <Btn onExec={() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor.tf as any).toggle.bulletedList();
      }}>Bullet list</Btn>
      <Btn onExec={() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor.tf as any).toggle.numberedList();
      }}>Numbered list</Btn>
      <Btn onExec={() => editor.tf.insertNodes({
        type: "table",
        children: [
          { type: "tr", children: [{ type: "th", children: [{ text: "A" }] }, { type: "th", children: [{ text: "B" }] }] },
          { type: "tr", children: [{ type: "td", children: [{ text: "" }] }, { type: "td", children: [{ text: "" }] }] },
        ],
      })}>Table</Btn>
      <Btn onExec={() => editor.tf.insertNodes({ type: "hr", children: [{ text: "" }] })}>HR</Btn>
    </div>
  );
}

function Btn({ children, onExec, pressed }: { children: React.ReactNode; onExec: () => void; pressed?: boolean }) {
  return (
    <span
      role="button"
      tabIndex={-1}
      onMouseDown={(e) => { e.preventDefault(); onExec(); }}
      className={`px-3 py-1.5 rounded text-sm cursor-pointer select-none ${pressed ? "bg-violet-600 text-white" : "bg-white/10 text-white/60 hover:text-white"}`}
    >
      {children}
    </span>
  );
}

export default function EditorTestPage() {
  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      HeadingPlugin,
      BlockquotePlugin,
      ListPlugin,
      CodeBlockPlugin,
      CodeLinePlugin,
      HorizontalRulePlugin,
      TablePlugin,
    ],
    override: {
      components: {
        // Marks
        [BoldPlugin.key]: BoldLeaf,
        [ItalicPlugin.key]: ItalicLeaf,
        [UnderlinePlugin.key]: UnderlineLeaf,
        [StrikethroughPlugin.key]: StrikethroughLeaf,
        [CodePlugin.key]: CodeLeaf,
        // Block elements
        p: ParagraphElement,
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
        code_block: CodeBlockElement,
        code_line: CodeLineElement,
        hr: HrElement,
        table: TableElement,
        tr: TableRowElement,
        td: TableCellElement,
        th: TableHeaderCellElement,
      },
    },
    value: initialValue,
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-2">Editor Test</h1>
      <p className="text-sm text-white/40 mb-6">Select text, then try toolbar buttons or Cmd+B / Cmd+I.</p>

      <Plate editor={editor}>
        <Toolbar />
        <PlateContent
          className="min-h-[200px] outline-none p-4 bg-white/5 rounded text-[17px] leading-[1.65]"
          placeholder="Type here..."
        />
      </Plate>
    </div>
  );
}
