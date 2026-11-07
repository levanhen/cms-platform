import { describe, expect, it } from "vitest";
import { expandTags } from "@web/lib/revalidate/expand-tags";

describe("expandTags", () => {
  it("invalidates service list on reorder tag", () => {
    const result = expandTags(["web:service:list", "web:sitemap"]);
    expect(result.keys).toContain("web:service:list");
    expect(result.keys).toContain("web:sitemap");
    expect(result.paths).toContain("/services");
    expect(result.paths).toContain("/");
  });

  it("invalidates project list wildcard", () => {
    const result = expandTags(["web:project:list"]);
    expect(result.keys).toContain("web:project:list:*");
    expect(result.paths).toContain("/projects");
  });

  it("maps news slug to detail path", () => {
    const result = expandTags(["web:news:hello"]);
    expect(result.paths).toContain("/news/hello");
    expect(result.paths).toContain("/news");
    expect(result.keys).toContain("web:news:list:*");
  });

  it("maps documents tag", () => {
    const result = expandTags(["web:documents"]);
    expect(result.keys).toContain("web:document:list:*");
    expect(result.paths).toContain("/documents");
  });
});
