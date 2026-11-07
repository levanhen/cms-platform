import { getPublicSettings, getSitemapEntries } from "@/lib/queries/published";
import { siteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Extended URL catalog for LLMs (companion to /llms.txt). */
export async function GET() {
  const [settings, entries] = await Promise.all([
    getPublicSettings(),
    getSitemapEntries(),
  ]);

  const name = settings.site_name || "CMS";
  const lines: string[] = [
    `# ${name} — Full content index`,
    `> Danh sách URL nội dung đã xuất bản. Bản tóm tắt: ${siteUrl("/llms.txt")}`,
    "",
    "## Static",
    "",
    `- ${siteUrl("/")}`,
    `- ${siteUrl("/services")}`,
    `- ${siteUrl("/projects")}`,
    `- ${siteUrl("/news")}`,
    `- ${siteUrl("/documents")}`,
    `- ${siteUrl("/contact")}`,
    "",
    "## Pages",
    "",
    ...entries.pages.map((p) => `- ${siteUrl(`/pages/${p.slug}`)}`),
    "",
    "## Services",
    "",
    ...entries.services.map((p) => `- ${siteUrl(`/services/${p.slug}`)}`),
    "",
    "## Projects",
    "",
    ...entries.projects.map((p) => `- ${siteUrl(`/projects/${p.slug}`)}`),
    "",
    "## News",
    "",
    ...entries.news.map((p) => `- ${siteUrl(`/news/${p.slug}`)}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
