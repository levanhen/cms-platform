import path from "node:path";
import { isPathInsideRoot } from "@/lib/path-safe";
import { resolveLocalStorageRoot } from "@/lib/storage-root";

export function getLocalStorageRoot() {
  return resolveLocalStorageRoot();
}

/** Extract storage key from public URL `/uploads/...`. */
export function keyFromPublicUrl(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return null;
  return url.replace(/^\/uploads\//, "");
}

export function resolveStoragePath(key: string) {
  const root = getLocalStorageRoot();
  const fullPath = path.resolve(root, key);
  if (!isPathInsideRoot(root, fullPath)) return null;
  return fullPath;
}
