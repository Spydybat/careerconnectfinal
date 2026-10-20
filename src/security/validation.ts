/**
 * Sprint 12 — shared input validation primitives.
 *
 * Every server function validates its input with these schemas so validation
 * rules live in one reviewable place. All schemas are strict: unknown shapes,
 * oversized strings, control characters and out-of-range numbers are rejected
 * rather than coerced.
 */

import { z } from "zod";

/** Characters that have no business being inside user-supplied identifiers or text. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export const MAX_TEXT = {
  short: 120,
  name: 200,
  line: 500,
  paragraph: 4_000,
  document: 40_000,
} as const;

/** A UUID that came from the client. Never interpolated into SQL. */
export const uuidSchema = z.string().uuid("Invalid identifier");

export const optionalUuidSchema = uuidSchema.optional();

/** Trimmed, control-character-free text with an explicit maximum length. */
export function textSchema(max: number, { min = 1 }: { min?: number } = {}) {
  return z
    .string()
    .transform((v) => v.replace(/\u0000/g, "").trim())
    .refine((v) => v.length >= min, { message: `Must be at least ${min} character(s)` })
    .refine((v) => v.length <= max, { message: `Must be at most ${max} characters` })
    .refine((v) => !CONTROL_CHARS.test(v), { message: "Contains unsupported characters" });
}

export const shortTextSchema = textSchema(MAX_TEXT.short);
export const nameSchema = textSchema(MAX_TEXT.name);
export const paragraphSchema = textSchema(MAX_TEXT.paragraph);
export const documentTextSchema = textSchema(MAX_TEXT.document);

export const emailSchema = z.string().trim().toLowerCase().email("Invalid email address").max(255);

/**
 * Free-text search. Kept as an opaque value: callers must pass it to the query
 * builder as a bound parameter (never string-concatenated into SQL), so the
 * only job here is bounding length and stripping control characters.
 */
export const searchSchema = z
  .string()
  .transform((v) =>
    v
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, 120),
  )
  .refine((v) => !CONTROL_CHARS.test(v), { message: "Invalid search term" });

/** PostgREST `or`/`ilike` metacharacters that would change filter meaning. */
const POSTGREST_META = /[,()*"\\]/g;

/** Escapes a search term for safe use inside an `ilike` pattern. */
export function escapeLikePattern(term: string): string {
  return term.replace(POSTGREST_META, " ").replace(/[%_]/g, (m) => `\\${m}`);
}

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;

export const paginationSchema = z
  .object({
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export type Pagination = z.infer<typeof paginationSchema>;

export function toRange(pagination: Pagination): { from: number; to: number } {
  const from = (pagination.page - 1) * pagination.pageSize;
  return { from, to: from + pagination.pageSize - 1 };
}

/** Sort parameters must be an allow-listed column — never a client-supplied string. */
export function sortSchema<T extends readonly [string, ...string[]]>(columns: T) {
  return z
    .object({
      column: z.enum(columns),
      direction: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict();
}

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

export const isoTimestampSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid timestamp" });

export const dateRangeSchema = z
  .object({ from: isoDateSchema, to: isoDateSchema })
  .strict()
  .refine((v) => v.from <= v.to, { message: "Start date must be before end date" });

export function boundedInt(min: number, max: number) {
  return z.number().int().min(min).max(max);
}

export const yearSchema = boundedInt(1950, 2100);
export const currencySchema = boundedInt(0, 100_000_000);
export const scoreSchema = boundedInt(0, 100);

/** Metadata describing a file the browser is about to upload. */
export const fileMetadataSchema = z
  .object({
    name: textSchema(255),
    size: z
      .number()
      .int()
      .positive()
      .max(50 * 1024 * 1024),
    type: z
      .string()
      .max(150)
      .regex(/^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/i, "Invalid content type"),
  })
  .strict();

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

/**
 * Parses input and throws a message that is safe to show a user. Zod issues are
 * summarised without echoing the offending value back.
 */
export function parseInput<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data as z.infer<S>;
  const first = result.error.issues[0];
  const path = first?.path.join(".");
  throw new Error(
    `Invalid request${path ? ` (${path})` : ""}: ${first?.message ?? "malformed input"}`,
  );
}
