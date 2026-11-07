/** Only allow same-origin relative paths (blocks open redirects). */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard") {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  if (value.includes("\0")) return fallback;
  return value;
}
