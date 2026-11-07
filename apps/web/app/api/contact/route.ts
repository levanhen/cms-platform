import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ContactMessageStatus, prisma } from "@cms/db";
import { getPublicSettings } from "@/lib/queries/published";
import { isSmtpReady, sendContactMail } from "@/lib/mail";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(10).max(5000),
  /** Honeypot — must stay empty */
  company: z.string().max(0).optional().or(z.literal("")),
});

const rateMap = new Map<string, { count: number; resetAt: number }>();

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const COOLDOWN_MS = 15 * 60 * 1000;
const DUPLICATE_MS = 24 * 60 * 60 * 1000;

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function allowBurst(ip: string) {
  const now = Date.now();
  const current = rateMap.get(ip);
  if (!current || current.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_MAX) return false;
  current.count += 1;
  return true;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildContentHash(email: string, subject: string, message: string) {
  const payload = [
    normalizeText(email),
    normalizeText(subject),
    normalizeText(message),
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

const SPAM_MESSAGE =
  "Bạn gửi quá nhiều lần hoặc nội dung trùng. Vui lòng thử lại sau.";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!allowBurst(ip)) {
    return NextResponse.json({ message: SPAM_MESSAGE }, { status: 429 });
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
      { message: "Vui lòng kiểm tra lại thông tin form." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.company) {
    // Bot filled honeypot — pretend success
    return NextResponse.json({ ok: true });
  }

  const email = data.email.toLowerCase();
  const contentHash = buildContentHash(email, data.subject, data.message);
  const now = new Date();
  const cooldownSince = new Date(now.getTime() - COOLDOWN_MS);
  const duplicateSince = new Date(now.getTime() - DUPLICATE_MS);

  const [cooldownHit, duplicateHit] = await Promise.all([
    prisma.contactMessage.findFirst({
      where: {
        createdAt: { gte: cooldownSince },
        OR: [
          ...(ip !== "unknown" ? [{ ipAddress: ip }] : []),
          { email },
        ],
      },
      select: { id: true },
    }),
    prisma.contactMessage.findFirst({
      where: {
        contentHash,
        createdAt: { gte: duplicateSince },
      },
      select: { id: true },
    }),
  ]);

  if (cooldownHit || duplicateHit) {
    return NextResponse.json({ message: SPAM_MESSAGE }, { status: 429 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;

  let emailSent = false;
  let emailError: string | null = null;

  const settings = await getPublicSettings();
  const to = settings.contact_email;

  if (isSmtpReady() && to) {
    try {
      await sendContactMail({
        to,
        name: data.name,
        email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
      });
      emailSent = true;
    } catch (error) {
      console.error("[contact:smtp]", error);
      emailError =
        error instanceof Error ? error.message.slice(0, 500) : "SMTP_ERROR";
    }
  } else if (!isSmtpReady()) {
    emailError = "SMTP_NOT_CONFIGURED";
  } else if (!to) {
    emailError = "CONTACT_EMAIL_MISSING";
  }

  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      status: ContactMessageStatus.NEW,
      ipAddress: ip === "unknown" ? null : ip,
      userAgent,
      contentHash,
      emailSent,
      emailError,
    },
  });

  return NextResponse.json({ ok: true });
}
