import {
  getPublicSettings,
  getSitemapEntries,
  listPublishedServices,
} from "@/lib/queries/published";
import { siteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * llms.txt - short site map for LLM crawlers / assistants.
 * @see https://llmstxt.org/
 */
export async function GET() {
  const [settings, entries, services] = await Promise.all([
    getPublicSettings(),
    getSitemapEntries(),
    listPublishedServices(),
  ]);

  const name = settings.site_name || "CMS";
  const desc =
    settings.site_description ||
    settings.default_seo_description ||
    "Website cong khai noi dung da xuat ban tu CMS.";

  const home = siteUrl("/");
  const servicesUrl = siteUrl("/services");
  const projectsUrl = siteUrl("/projects");
  const newsUrl = siteUrl("/news");
  const documentsUrl = siteUrl("/documents");
  const contactUrl = siteUrl("/contact");
  const email = settings.contact_email || "-";
  const phone = settings.contact_phone || "-";

  const vi: string[] = [];
  vi.push("# " + name);
  vi.push("> " + desc);
  vi.push("");
  vi.push("Ngôn ngữ: Tiếng Việt (vi)");
  vi.push("Site: " + home);
  vi.push("");
  vi.push("## Tổng quan");
  vi.push("");
  vi.push("- Đây là website công khai của " + name + ".");
  vi.push(
    "- Nội dung (trang, dịch vụ, dự án, tin tức, tài liệu) chỉ gồm bản đã xuất bản (Published).",
  );
  vi.push("- Không yêu cầu đăng nhập để đọc nội dung.");
  vi.push("- Liên hệ: " + email + " | " + phone);
  if (settings.contact_address) {
    vi.push("- Địa chỉ: " + settings.contact_address);
  }
  vi.push("");
  vi.push("## Trang chính");
  vi.push("");
  vi.push("- [Trang chủ](" + home + "): Giới thiệu và nội dung nổi bật");
  vi.push("- [Dịch vụ](" + servicesUrl + "): Danh sách dịch vụ");
  vi.push("- [Dự án](" + projectsUrl + "): Danh sách dự án");
  vi.push("- [Tin tức](" + newsUrl + "): Bài viết / tin tức");
  vi.push("- [Tài liệu](" + documentsUrl + "): Tài liệu công khai (tải xuống)");
  vi.push("- [Liên hệ](" + contactUrl + "): Form và thông tin liên hệ");
  vi.push("");

  if (services.length) {
    vi.push("## Dịch vụ đã xuất bản");
    vi.push("");
    for (const s of services.slice(0, 20)) {
      const summary = s.shortDescription ? " - " + s.shortDescription : "";
      vi.push("- [" + s.name + "](" + siteUrl("/services/" + s.slug) + ")" + summary);
    }
    vi.push("");
  }

  if (entries.pages.length) {
    vi.push("## Trang nội dung");
    vi.push("");
    for (const p of entries.pages.slice(0, 30)) {
      vi.push("- [" + p.slug + "](" + siteUrl("/pages/" + p.slug) + ")");
    }
    vi.push("");
  }

  vi.push("## Khám phá thêm");
  vi.push("");
  vi.push("- [Sitemap XML](" + siteUrl("/sitemap.xml") + ")");
  vi.push(
    "- [llms-full.txt](" +
      siteUrl("/llms-full.txt") +
      "): danh sách URL nội dung chi tiết hơn",
  );
  vi.push("- [robots.txt](" + siteUrl("/robots.txt") + ")");
  vi.push("");
  vi.push("## Ghi chú cho AI");
  vi.push("");
  vi.push("- Ưu tiên thông tin trên các URL Published trong sitemap.");
  vi.push("- Không suy diễn nội dung Draft / chưa xuất bản.");
  vi.push("- Khi trích dẫn, nêu rõ tiêu đề trang và URL nguồn.");
  vi.push("");

  return new Response(vi.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
