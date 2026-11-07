import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@bo/lib/auth/safe-callback-url";

describe("safeCallbackUrl", () => {
  it("defaults when empty", () => {
    expect(safeCallbackUrl(null)).toBe("/dashboard");
    expect(safeCallbackUrl("")).toBe("/dashboard");
  });

  it("allows relative same-origin paths", () => {
    expect(safeCallbackUrl("/pages")).toBe("/pages");
    expect(safeCallbackUrl("/users/abc?x=1")).toBe("/users/abc?x=1");
  });

  it("blocks open redirects", () => {
    expect(safeCallbackUrl("//evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("https://evil.com")).toBe("/dashboard");
    expect(safeCallbackUrl("/\\evil")).toBe("/dashboard");
    expect(safeCallbackUrl("http://x")).toBe("/dashboard");
  });
});
