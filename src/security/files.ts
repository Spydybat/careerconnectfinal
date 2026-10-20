/**
 * Sprint 12 — file security.
 *
 * Every user file (resume, certificate, avatar) is validated against a policy
 * before upload, stored under a path derived from the owner's user id, and read
 * back only through an ownership check. Storage RLS is the second layer; these
 * helpers are the first.
 */

export type FileKind = "resume" | "certificate" | "avatar";

export type FilePolicy = {
  bucket: string;
  maxBytes: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
};

export const FILE_POLICIES: Record<FileKind, FilePolicy> = {
  resume: {
    bucket: "resumes",
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    extensions: ["pdf", "doc", "docx", "txt"],
  },
  certificate: {
    bucket: "resumes",
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["application/pdf", "image/png", "image/jpeg"],
    extensions: ["pdf", "png", "jpg", "jpeg"],
  },
  avatar: {
    bucket: "resumes",
    maxBytes: 2 * 1024 * 1024,
    mimeTypes: ["image/png", "image/jpeg", "image/webp"],
    extensions: ["png", "jpg", "jpeg", "webp"],
  },
};

export class FileValidationError extends Error {
  readonly code:
    "too_large" | "empty" | "bad_type" | "bad_extension" | "bad_name" | "type_mismatch";
  constructor(code: FileValidationError["code"], message: string) {
    super(message);
    this.name = "FileValidationError";
    this.code = code;
  }
}

/** Extension→mime agreement, so `payload.exe` cannot masquerade as a PDF. */
const EXTENSION_MIME: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
};

export function fileExtension(name: string): string {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(name.trim());
  return match?.[1]?.toLowerCase() ?? "";
}

/**
 * Collapses a client file name to a safe storage segment: no directories, no
 * traversal, no control characters, no double extensions, bounded length.
 */
export function sanitizeFileName(name: string): string {
  const base = name
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

  const ext = fileExtension(base);
  const stem = (ext ? base.slice(0, -(ext.length + 1)) : base)
    .replace(/\.+/g, "_")
    .replace(/[^\w-]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  const safeStem = stem || "file";
  return ext ? `${safeStem}.${ext}` : safeStem;
}

export type UploadCandidate = { name: string; size: number; type: string };

/** Full pre-upload validation. Throws a user-safe FileValidationError. */
export function validateUpload(kind: FileKind, file: UploadCandidate): { safeName: string } {
  const policy = FILE_POLICIES[kind];

  if (!file.size) throw new FileValidationError("empty", "That file is empty.");
  if (file.size > policy.maxBytes) {
    throw new FileValidationError(
      "too_large",
      `File is too large. Maximum size is ${Math.round(policy.maxBytes / (1024 * 1024))} MB.`,
    );
  }

  const safeName = sanitizeFileName(file.name);
  if (!safeName || safeName === "file") {
    throw new FileValidationError("bad_name", "Please give the file a valid name.");
  }

  const ext = fileExtension(safeName);
  if (!policy.extensions.includes(ext)) {
    throw new FileValidationError(
      "bad_extension",
      `Unsupported file type. Allowed: ${policy.extensions.join(", ")}.`,
    );
  }

  const mime = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!policy.mimeTypes.includes(mime)) {
    throw new FileValidationError(
      "bad_type",
      `Unsupported content type. Allowed: ${policy.extensions.join(", ")}.`,
    );
  }

  const expected = EXTENSION_MIME[ext] ?? [];
  if (expected.length > 0 && !expected.includes(mime)) {
    throw new FileValidationError(
      "type_mismatch",
      "The file's extension does not match its content type.",
    );
  }

  return { safeName };
}

/** Storage path is always `<ownerUserId>/<timestamp>-<safe name>`. */
export function buildStoragePath(
  ownerUserId: string,
  fileName: string,
  now: number = Date.now(),
): string {
  if (!/^[0-9a-f-]{36}$/i.test(ownerUserId)) {
    throw new FileValidationError("bad_name", "Invalid owner for upload.");
  }
  return `${ownerUserId}/${now}-${sanitizeFileName(fileName)}`;
}

/** Rejects traversal, absolute paths and encoded separators. */
export function isSafeStoragePath(path: string): boolean {
  if (!path || path.length > 400) return false;
  if (path.startsWith("/") || path.includes("\\")) return false;
  if (/%2e|%2f|%5c/i.test(path)) return false;
  const segments = path.split("/");
  if (segments.length !== 2) return false;
  return segments.every((s) => s.length > 0 && s !== "." && s !== ".." && !s.includes(".."));
}

/** First-layer ownership check for reads/deletes of a stored object. */
export function ownsStoragePath(ownerUserId: string, path: string): boolean {
  if (!isSafeStoragePath(path)) return false;
  return path.split("/")[0] === ownerUserId;
}

export function assertOwnedStoragePath(ownerUserId: string, path: string): string {
  if (!ownsStoragePath(ownerUserId, path)) {
    throw new Error("Forbidden: you don't have access to that file");
  }
  return path;
}
