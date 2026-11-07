import { NewsletterStatus, prisma } from "@cms/db";
import { auth } from "@/auth";
import { requirePagePermission } from "@/lib/permissions/require-page";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  requirePagePermission(session?.user.permissions, "newsletter:view");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.toUpperCase() ?? "ALL";
  const statusFilter =
    statusParam === "ACTIVE" || statusParam === "UNSUBSCRIBED"
      ? (statusParam as NewsletterStatus)
      : null;

  const rows = await prisma.newsletterSubscriber.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(search
        ? { email: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { subscribedAt: "desc" },
    take: 10_000,
  });

  const header = ["email", "status", "source", "subscribed_at", "unsubscribed_at"];
  const lines = [
    header.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.email),
        row.status,
        csvEscape(row.source ?? ""),
        row.subscribedAt.toISOString(),
        row.unsubscribedAt?.toISOString() ?? "",
      ].join(","),
    ),
  ];

  const body = `\uFEFF${lines.join("\n")}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers.csv"`,
    },
  });
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
