import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@bo": path.resolve(__dirname, "apps/bo-cms"),
      "@web": path.resolve(__dirname, "apps/web"),
    },
  },
});
