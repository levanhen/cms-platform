/** Map BO revalidate tags → Redis keys + Next.js paths. */
export function expandTags(tags: string[]) {
  const keys = new Set<string>();
  const paths = new Set<string>(["/"]);

  for (const tag of tags) {
    keys.add(tag);
    if (tag === "web:settings:public" || tag === "web:layout") {
      paths.add("/");
      continue;
    }
    if (tag === "web:sitemap") {
      keys.add("web:sitemap");
      continue;
    }
    if (tag === "web:documents" || tag.startsWith("web:document:")) {
      keys.add("web:document:list:*");
      paths.add("/documents");
      continue;
    }
    if (tag.startsWith("web:page:")) {
      const slug = tag.slice("web:page:".length);
      paths.add(`/pages/${slug}`);
      continue;
    }
    if (tag.startsWith("web:service:")) {
      keys.add("web:service:list");
      const slug = tag.slice("web:service:".length);
      if (slug && slug !== "list") paths.add(`/services/${slug}`);
      paths.add("/services");
      continue;
    }
    if (tag.startsWith("web:project:")) {
      keys.add("web:project:list:*");
      const slug = tag.slice("web:project:".length);
      if (slug && slug !== "list") paths.add(`/projects/${slug}`);
      paths.add("/projects");
      continue;
    }
    if (tag.startsWith("web:news:")) {
      keys.add("web:news:list:*");
      const slug = tag.slice("web:news:".length);
      if (slug && slug !== "list") paths.add(`/news/${slug}`);
      paths.add("/news");
      continue;
    }
  }

  return { keys: [...keys], paths: [...paths] };
}
