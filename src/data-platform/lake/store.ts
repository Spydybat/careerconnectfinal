/**
 * Lake store implementations.
 *
 * `MemoryLakeStore` is the default (deterministic, testable, no I/O).
 * `createFsLakeStore` is used by the local CLI to materialise the lake on disk.
 */

import type { Layer } from "../config";
import { relocate } from "./paths";
import type { LakeObject, LakeStore, LakeWriteResult } from "./types";

export function createMemoryLakeStore(): LakeStore {
  const objects = new Map<string, LakeObject<unknown>>();

  return {
    write<T>(object: LakeObject<T>): LakeWriteResult {
      objects.set(object.path, object as LakeObject<unknown>);
      return {
        path: object.path,
        record_count: object.records.length,
        batch_id: object.metadata.batch_id,
      };
    },
    read<T>(path: string): LakeObject<T> | undefined {
      return objects.get(path) as LakeObject<T> | undefined;
    },
    list(layer?: Layer, domain?: string): string[] {
      return [...objects.keys()]
        .filter((p) => (layer ? p.startsWith(`${layer}/`) : true))
        .filter((p) => (domain ? p.includes(`/${domain}/`) : true))
        .sort();
    },
    move(path: string, targetLayer: Layer): string {
      const existing = objects.get(path);
      if (!existing) throw new Error(`Lake object not found: ${path}`);
      const target = relocate(path, targetLayer);
      objects.delete(path);
      objects.set(target, { ...existing, layer: targetLayer, path: target });
      return target;
    },
    clear() {
      objects.clear();
    },
  };
}

export interface FileSystemLike {
  mkdirSync(path: string, options: { recursive: true }): void;
  writeFileSync(path: string, data: string): void;
  readFileSync(path: string, encoding: "utf8"): string;
  existsSync(path: string): boolean;
  rmSync(path: string, options: { recursive: true; force: true }): void;
}

/**
 * Filesystem-backed lake. `fs` is injected so this module stays free of
 * Node built-ins (it must remain importable from any runtime).
 */
export function createFsLakeStore(fs: FileSystemLike, root: string): LakeStore {
  const memory = createMemoryLakeStore();
  const full = (p: string) => `${root}/${p}`;
  const dirOf = (p: string) => p.slice(0, p.lastIndexOf("/"));

  return {
    write<T>(object: LakeObject<T>): LakeWriteResult {
      const result = memory.write(object);
      fs.mkdirSync(dirOf(full(object.path)), { recursive: true });
      fs.writeFileSync(
        full(object.path),
        JSON.stringify({ metadata: object.metadata, records: object.records }, null, 0),
      );
      fs.writeFileSync(
        full(`${dirOf(object.path)}/_manifest.json`),
        JSON.stringify(object.metadata, null, 2),
      );
      return result;
    },
    read<T>(path: string): LakeObject<T> | undefined {
      const cached = memory.read<T>(path);
      if (cached) return cached;
      if (!fs.existsSync(full(path))) return undefined;
      const parsed = JSON.parse(fs.readFileSync(full(path), "utf8")) as {
        metadata: LakeObject<T>["metadata"];
        records: T[];
      };
      const [layer = "raw", domain = "unknown"] = path.split("/");
      return {
        layer: layer as Layer,
        domain,
        path,
        metadata: parsed.metadata,
        records: parsed.records,
      };
    },
    list: memory.list,
    move(path: string, targetLayer: Layer): string {
      const object = this.read(path);
      if (!object) throw new Error(`Lake object not found: ${path}`);
      const target = memory.move(path, targetLayer);
      const moved = memory.read(target);
      if (moved) {
        fs.mkdirSync(dirOf(full(target)), { recursive: true });
        fs.writeFileSync(
          full(target),
          JSON.stringify({ metadata: moved.metadata, records: moved.records }, null, 0),
        );
      }
      return target;
    },
    clear() {
      memory.clear();
      if (fs.existsSync(root)) fs.rmSync(root, { recursive: true, force: true });
    },
  };
}
