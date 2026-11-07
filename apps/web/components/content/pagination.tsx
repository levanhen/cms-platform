import Link from "next/link";

type Props = {
  current: number;
  totalPages: number;
  hrefFor: (page: number) => string;
};

export function Pagination({ current, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;
  const prev = current > 1 ? current - 1 : null;
  const next = current < totalPages ? current + 1 : null;

  return (
    <nav className="mt-12 flex items-center justify-between border-t border-line pt-6 text-sm">
      {prev ? (
        <Link href={hrefFor(prev)} className="text-muted transition hover:text-accent-deep">
          ← Trang trước
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Trang {current} / {totalPages}
      </span>
      {next ? (
        <Link href={hrefFor(next)} className="text-muted transition hover:text-accent-deep">
          Trang sau →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
