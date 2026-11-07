import { NewsletterStatus, prisma } from "@cms/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  source: z.string().trim().max(40).optional().or(z.literal("")),
  /** Honeypot — must stay empty */
  website: z.string().max(0).optional().or(z.literal("")),
});

const rateMap = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function allowRequest(ip: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 8;
  const current = rateMap.get(ip);
  if (!current || current.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!allowRequest(ip)) {
    return NextResponse.json(
      { message: "Bạn gửi quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Vui lòng nhập email hợp lệ." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const email = data.email.toLowerCase();
  const source = data.source?.trim() || "footer";
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing?.status === NewsletterStatus.ACTIVE) {
      return NextResponse.json({
        ok: true,
        message: "Email này đã đăng ký nhận tin.",
      });
    }

    if (existing) {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: NewsletterStatus.ACTIVE,
          source,
          ipAddress: ip === "unknown" ? null : ip,
          userAgent,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });
    } else {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          status: NewsletterStatus.ACTIVE,
          source,
          ipAddress: ip === "unknown" ? null : ip,
          userAgent,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Đăng ký nhận tin thành công.",
    });
  } catch (error) {
    console.error("[newsletter]", error);
    return NextResponse.json(
      { message: "Không lưu được đăng ký. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
