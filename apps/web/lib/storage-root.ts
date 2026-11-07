import { existsSync } from "node:fs";
import path from "node:path";

/** Walk up from cwd until pnpm-workspace.yaml (monorepo root). */
export function findMonorepoRoot(start = process.cwd()) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/**
 * Shared local uploads root for BO + web.
 * Relative STORAGE_LOCAL_PATH is resolved from monorepo root (not app cwd).
 */
export function resolveLocalStorageRoot(configured = process.env.STORAGE_LOCAL_PATH) {
  const raw = configured?.trim() || "apps/bo-cms/uploads";
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(findMonorepoRoot(), raw);
}
