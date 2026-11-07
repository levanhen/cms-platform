"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

function EditorSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "min-h-[280px] animate-pulse rounded-xl border border-border bg-muted/50"
      }
      aria-hidden
    />
  );
}

export const RichTextEditor = dynamic(
  () =>
    import("@/components/editors/rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

export const ImageField = dynamic(
  () => import("@/components/editors/image-field").then((m) => m.ImageField),
  {
    ssr: false,
    loading: () => <EditorSkeleton className="h-36 animate-pulse rounded-xl border border-border bg-muted/50" />,
  },
);

export const NewsCoverField = dynamic(
  () =>
    import("@/components/editors/news-cover-field").then((m) => m.NewsCoverField),
  {
    ssr: false,
    loading: () => <EditorSkeleton className="h-40 animate-pulse rounded-xl border border-border bg-muted/50" />,
  },
);

export const MediaPicker = dynamic(
  () => import("@/features/media/media-picker").then((m) => m.MediaPicker),
  { ssr: false },
);

export type RichTextEditorProps = ComponentProps<
  typeof import("@/components/editors/rich-text-editor").RichTextEditor
>;
