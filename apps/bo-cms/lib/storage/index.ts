import { mkdir, writeFile, unlink, access } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isPathInsideRoot } from "@/lib/path-safe";
import { resolveLocalStorageRoot } from "@/lib/storage-root";

export type StoredObject = {
  key: string;
  url: string;
  size: number;
};

export interface StorageProvider {
  upload(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
  }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

function sanitizeFileName(fileName: string) {
  const base = path.basename(fileName).toLowerCase();
  return base.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;
  private publicPrefix: string;

  constructor(root = resolveLocalStorageRoot()) {
    this.root = root;
    this.publicPrefix = "/uploads";
  }

  private resolveKeyPath(key: string) {
    const normalized = key.replace(/^\/+/, "");
    const full = path.resolve(this.root, normalized);
    if (!isPathInsideRoot(this.root, full)) {
      throw new Error("Đường dẫn storage không hợp lệ.");
    }
    return full;
  }

  async upload(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
  }): Promise<StoredObject> {
    const folder = (input.folder ?? "media").replace(/[^a-z0-9/_-]/gi, "");
    const safeName = sanitizeFileName(input.fileName);
    const key = path.posix.join(folder, `${randomUUID()}-${safeName}`);
    const fullPath = this.resolveKeyPath(key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
    return {
      key,
      url: `${this.publicPrefix}/${key}`,
      size: input.buffer.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveKeyPath(key);
    try {
      await unlink(fullPath);
    } catch {
      // ignore missing file
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKeyPath(key));
      return true;
    } catch {
      return false;
    }
  }

  getRoot() {
    return this.root;
  }
}

let storageSingleton: LocalStorageProvider | undefined;

export function getStorage(): StorageProvider {
  if (!storageSingleton) {
    storageSingleton = new LocalStorageProvider();
  }
  return storageSingleton;
}

export function getLocalStorageRoot() {
  if (!storageSingleton) {
    storageSingleton = new LocalStorageProvider();
  }
  return storageSingleton.getRoot();
}
