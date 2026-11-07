import { describe, expect, it } from "vitest";
import {
  hasAnyPermission,
  hasPermission,
} from "@bo/lib/permissions/constants";

describe("hasPermission", () => {
  it("checks membership", () => {
    expect(hasPermission(["page:view", "page:update"], "page:view")).toBe(true);
    expect(hasPermission(["page:view"], "page:delete")).toBe(false);
    expect(hasPermission(undefined, "page:view")).toBe(false);
  });

  it("hasAnyPermission", () => {
    expect(hasAnyPermission(["a"], ["b", "a"])).toBe(true);
    expect(hasAnyPermission(["a"], ["b"])).toBe(false);
  });
});
