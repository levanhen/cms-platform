import path from "node:path";
import { describe, expect, it } from "vitest";
import { isPathInsideRoot } from "@web/lib/path-safe";

describe("isPathInsideRoot", () => {
  const root = path.resolve("/var/cms/uploads");

  it("allows files inside root", () => {
    expect(isPathInsideRoot(root, path.join(root, "media", "a.jpg"))).toBe(true);
    expect(isPathInsideRoot(root, root)).toBe(true);
  });

  it("blocks prefix sibling traversal", () => {
    expect(isPathInsideRoot(root, path.resolve("/var/cms/uploads-evil/x"))).toBe(
      false,
    );
    expect(isPathInsideRoot(root, path.resolve("/var/cms/other/x"))).toBe(false);
  });
});
