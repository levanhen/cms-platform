import path from "node:path";

/** True when `fullPath` is inside `root` (not a prefix sibling like `root-evil`). */
export function isPathInsideRoot(root: string, fullPath: string) {
  const normalizedRoot = path.resolve(root);
  const normalizedFull = path.resolve(fullPath);
  const prefix = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : normalizedRoot + path.sep;
  return normalizedFull === normalizedRoot || normalizedFull.startsWith(prefix);
}
