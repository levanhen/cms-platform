"use client";

import { useEffect, useState } from "react";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { BackgroundColor, Color, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
  Video,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaPicker } from "@/features/media/media-picker";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  "#18181b",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
];

const HIGHLIGHT_COLORS = [
  "#fef08a",
  "#bbf7d0",
  "#bfdbfe",
  "#fbcfe8",
  "#ddd6fe",
  "#fecaca",
];

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 px-1.5",
        active && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  canUpload = true,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  canUpload?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {
          HTMLAttributes: { class: "rounded-md bg-muted p-3 font-mono text-xs" },
        },
      }),
      Underline,
      TextStyle,
      Color,
      BackgroundColor,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({
        allowBase64: false,
        resize: {
          enabled: true,
          alwaysPreserveAspectRatio: true,
          minWidth: 80,
          minHeight: 80,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
        },
        HTMLAttributes: { class: "rounded-md" },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360,
        HTMLAttributes: { class: "my-3 aspect-video w-full max-w-full rounded-md" },
      }),
      TableKit.configure({
        table: {
          resizable: true,
          renderWrapper: true,
          HTMLAttributes: { class: "editor-table" },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[320px] px-3 py-2 text-sm outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || sourceMode) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor, sourceMode]);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      canUndo: ctx.editor?.can().undo() ?? false,
      canRedo: ctx.editor?.can().redo() ?? false,
      isBold: ctx.editor?.isActive("bold") ?? false,
      isItalic: ctx.editor?.isActive("italic") ?? false,
      isUnderline: ctx.editor?.isActive("underline") ?? false,
      isStrike: ctx.editor?.isActive("strike") ?? false,
      isCode: ctx.editor?.isActive("code") ?? false,
      isCodeBlock: ctx.editor?.isActive("codeBlock") ?? false,
      isHighlight: ctx.editor?.isActive("highlight") ?? false,
      isSub: ctx.editor?.isActive("subscript") ?? false,
      isSuper: ctx.editor?.isActive("superscript") ?? false,
      isH1: ctx.editor?.isActive("heading", { level: 1 }) ?? false,
      isH2: ctx.editor?.isActive("heading", { level: 2 }) ?? false,
      isH3: ctx.editor?.isActive("heading", { level: 3 }) ?? false,
      isBullet: ctx.editor?.isActive("bulletList") ?? false,
      isOrdered: ctx.editor?.isActive("orderedList") ?? false,
      isQuote: ctx.editor?.isActive("blockquote") ?? false,
      alignLeft: ctx.editor?.isActive({ textAlign: "left" }) ?? false,
      alignCenter: ctx.editor?.isActive({ textAlign: "center" }) ?? false,
      alignRight: ctx.editor?.isActive({ textAlign: "right" }) ?? false,
      alignJustify: ctx.editor?.isActive({ textAlign: "justify" }) ?? false,
      isLink: ctx.editor?.isActive("link") ?? false,
      isImage: ctx.editor?.isActive("image") ?? false,
      isTable: ctx.editor?.isActive("table") ?? false,
      textColor: (ctx.editor?.getAttributes("textStyle").color as string) || "",
    }),
  });

  function openLinkPanel() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(previous || "https://");
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    }
    setLinkOpen(false);
  }

  function insertYoutube() {
    if (!editor) return;
    const url = window.prompt("Dán URL YouTube");
    if (!url?.trim()) return;
    editor.commands.setYoutubeVideo({ src: url.trim() });
  }

  function setImageWidthPercent(percent: number) {
    if (!editor) return;
    const containerWidth = (editor.view.dom as HTMLElement).clientWidth || 600;
    const width = Math.max(80, Math.round((containerWidth * percent) / 100));
    editor.chain().focus().updateAttributes("image", { width, height: null }).run();
  }

  function toggleSourceMode() {
    if (!editor) return;
    if (!sourceMode) {
      setSourceHtml(editor.getHTML());
      setSourceMode(true);
      return;
    }
    editor.commands.setContent(sourceHtml || "", { emitUpdate: true });
    onChange(editor.getHTML());
    setSourceMode(false);
  }

  if (!editor) {
    return (
      <div
        className={cn(
          "min-h-[380px] rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground",
          className,
        )}
      >
        Đang tải editor...
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
        <ToolbarButton title="Hoàn tác" disabled={!editorState?.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Làm lại" disabled={!editorState?.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="In đậm" active={editorState?.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="In nghiêng" active={editorState?.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Gạch dưới" active={editorState?.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Gạch ngang" active={editorState?.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code" active={editorState?.isCode} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Chỉ số dưới" active={editorState?.isSub} onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Chỉ số trên" active={editorState?.isSuper} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Xóa định dạng"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <div className="flex items-center gap-0.5 px-1" title="Màu chữ">
          {TEXT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "h-4 w-4 rounded-sm border border-border",
                editorState?.textColor === color && "ring-2 ring-primary",
              )}
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
            />
          ))}
          <ToolbarButton title="Bỏ màu chữ" onClick={() => editor.chain().focus().unsetColor().run()}>
            <Eraser className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-1" title="Tô sáng">
          <Highlighter className="mr-0.5 h-3.5 w-3.5 text-muted-foreground" />
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="h-4 w-4 rounded-sm border border-border"
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
            />
          ))}
          <ToolbarButton title="Bỏ tô sáng" onClick={() => editor.chain().focus().unsetHighlight().run()}>
            <Eraser className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        <Divider />

        <ToolbarButton title="Tiêu đề 1" active={editorState?.isH1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề 2" active={editorState?.isH2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Tiêu đề 3" active={editorState?.isH3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Danh sách" active={editorState?.isBullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Danh sách số" active={editorState?.isOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Trích dẫn" active={editorState?.isQuote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editorState?.isCodeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Căn trái" active={editorState?.alignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Căn giữa" active={editorState?.alignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Căn phải" active={editorState?.alignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Căn đều" active={editorState?.alignJustify} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Liên kết" active={editorState?.isLink} onClick={openLinkPanel}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Gỡ liên kết" disabled={!editorState?.isLink} onClick={() => editor.chain().focus().unsetLink().run()}>
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Chèn ảnh" onClick={() => setPickerOpen(true)}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="YouTube" onClick={insertYoutube}>
          <Video className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Chèn bảng"
          active={editorState?.isTable}
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>

        {editorState?.isTable ? (
          <>
            <ToolbarButton title="Thêm hàng" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <span className="text-[10px] font-semibold">+H</span>
            </ToolbarButton>
            <ToolbarButton title="Thêm cột" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <span className="text-[10px] font-semibold">+C</span>
            </ToolbarButton>
            <ToolbarButton title="Xóa hàng" onClick={() => editor.chain().focus().deleteRow().run()}>
              <span className="text-[10px] font-semibold">-H</span>
            </ToolbarButton>
            <ToolbarButton title="Xóa cột" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <span className="text-[10px] font-semibold">-C</span>
            </ToolbarButton>
            <ToolbarButton title="Xóa bảng" onClick={() => editor.chain().focus().deleteTable().run()}>
              <span className="text-[10px] font-semibold">×T</span>
            </ToolbarButton>
          </>
        ) : null}

        {editorState?.isImage ? (
          <>
            <Divider />
            <span className="px-1 text-xs text-muted-foreground">Rộng</span>
            {[25, 50, 75, 100].map((percent) => (
              <Button
                key={percent}
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs"
                onClick={() => setImageWidthPercent(percent)}
              >
                {percent}%
              </Button>
            ))}
          </>
        ) : null}

        <Divider />

        <ToolbarButton
          title="Xem / sửa HTML nguồn"
          active={sourceMode}
          onClick={toggleSourceMode}
        >
          <FileCode2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {linkOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="h-8 max-w-md text-sm"
            autoFocus
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Áp dụng
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setLinkOpen(false)}>
            Hủy
          </Button>
        </div>
      ) : null}

      {sourceMode ? (
        <textarea
          value={sourceHtml}
          onChange={(e) => {
            setSourceHtml(e.target.value);
            onChange(e.target.value);
          }}
          className="min-h-[320px] w-full resize-y border-0 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100 outline-none"
          spellCheck={false}
        />
      ) : (
        <>
          <EditorContent editor={editor} />
          <BubbleMenu
            editor={editor}
            className="flex gap-0.5 rounded-lg border border-border bg-card p-1 shadow-md"
          >
            <ToolbarButton title="Đậm" active={editorState?.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Nghiêng" active={editorState?.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Gạch dưới" active={editorState?.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Link" active={editorState?.isLink} onClick={openLinkPanel}>
              <Link2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Tô sáng" active={editorState?.isHighlight} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}>
              <Highlighter className="h-3.5 w-3.5" />
            </ToolbarButton>
          </BubbleMenu>
        </>
      )}

      {pickerOpen ? (
        <MediaPicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          canUpload={canUpload}
          onSelect={(items) => {
            const item = items[0];
            if (!item || !editor) return;
            editor
              .chain()
              .focus()
              .setImage({
                src: item.fileUrl,
                alt: item.altText ?? item.fileName,
              })
              .run();
          }}
        />
      ) : null}
    </div>
  );
}
