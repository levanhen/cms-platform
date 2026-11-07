import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  /** Fallback letter when no image */
  label?: string | null;
  className?: string;
};

/**
 * Compact thumbnail for BO content tables.
 * Shows image when URL exists; otherwise a muted placeholder.
 */
export function ListThumb({ src, alt = "", label, className }: Props) {
  const letter = (label || alt || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <div
          className="flex size-full flex-col items-center justify-center gap-0.5 text-muted-foreground"
          aria-hidden
        >
          <ImageIcon className="size-4 opacity-70" />
          <span className="text-[10px] font-semibold leading-none">{letter}</span>
        </div>
      )}
    </div>
  );
}
