import { HomeAbout } from "@/components/home/home-about";
import { HomeBlog } from "@/components/home/home-blog";
import { HomeHero } from "@/components/home/home-hero";
import { HomePortfolio } from "@/components/home/home-portfolio";
import { HomeProcess } from "@/components/home/home-process";
import { HomeServices } from "@/components/home/home-services";
import { HomeStats } from "@/components/home/home-stats";
import { HomeTeam } from "@/components/home/home-team";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { HomeWhy } from "@/components/home/home-why";
import {
  getPublishedPageBySlug,
  getPublicSettings,
  listPublishedNews,
  listPublishedProjects,
  listPublishedServices,
} from "@/lib/queries/published";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const settings = await getPublicSettings();
  return buildMetadata({
    title: settings.default_seo_title || settings.site_name,
    description: settings.default_seo_description || settings.site_description,
    path: "/",
  });
}

export default async function HomePage() {
  const [about, services, projects, news] = await Promise.all([
    getPublishedPageBySlug("about-us"),
    listPublishedServices(),
    listPublishedProjects(9),
    listPublishedNews(1, 3),
  ]);

  return (
    <>
      <HomeHero />

      {about ? (
        <HomeAbout
          title={about.title}
          summary={about.summary}
          contentHtml={about.content}
          slug={about.slug}
        />
      ) : (
        <HomeAbout
          title="Về chúng tôi"
          summary="Studio kiến trúc với hơn 20 năm kinh nghiệm thiết kế và thi công."
          slug="about-us"
        />
      )}

      <HomeServices services={services} />
      <HomeProcess />
      <HomeWhy />
      <HomePortfolio projects={projects} />
      <HomeStats />
      <HomeTestimonials />
      <HomeTeam />
      <HomeBlog items={news.items} />
    </>
  );
}
