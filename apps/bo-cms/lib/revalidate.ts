/**
 * Notify public web to drop Redis keys + revalidate paths after
 * publish / unpublish / archive / update of Published content.
 */
export async function triggerWebRevalidate(tags: string[]) {
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret || tags.length === 0) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ secret, tags }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[revalidate] failed", res.status, await res.text());
    }
  } catch (error) {
    console.error("[revalidate] error", error);
  }
}
