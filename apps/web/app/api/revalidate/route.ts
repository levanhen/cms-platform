import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { invalidateKeys } from "@/lib/cache/redis";
import { expandTags } from "@/lib/revalidate/expand-tags";

export const runtime = "nodejs";

type Body = {
  secret?: string;
  tags?: string[];
};

const rateMap = new Map<string, { count: number; resetAt: number }>();

function allowRevalidate(ip: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 60;
  const current = rateMap.get(ip);
  if (!current || current.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  if (!allowRevalidate(clientIp(request))) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const secret = body.secret || request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === "string") : [];
  const { keys, paths } = expandTags(tags.length ? tags : ["web:settings:public"]);

  await invalidateKeys(keys);

  for (const path of paths) {
    revalidatePath(path);
  }
  for (const tag of tags) {
    revalidateTag(tag);
  }

  return NextResponse.json({ ok: true, invalidated: keys, paths });
}
