/**
 * Sprint 12 — security regression tests.
 *
 * These assert the *invariants* of the hardening layer: validation rejects
 * hostile input, tenant guards deny cross-organization access, files cannot
 * escape their owner's prefix, audit metadata never carries secrets and errors
 * never leak internals.
 */

import { describe, expect, it } from "vitest";

import {
  MAX_PAGE_SIZE,
  paginationSchema,
  emailSchema,
  searchSchema,
  textSchema,
  toRange,
  uuidSchema,
} from "@/security/validation";
import { escapeHtml, sanitizeCsvCell, sanitizeError, sanitizeUserText } from "@/security/sanitize";
import {
  buildCsp,
  isRequestTooLarge,
  MAX_REQUEST_BYTES,
  securityHeaders,
} from "@/security/headers";
import { RATE_POLICIES, RateLimiter, RateLimitError, rateKey } from "@/security/rate-limit";
import {
  buildStoragePath,
  FileValidationError,
  isSafeStoragePath,
  ownsStoragePath,
  sanitizeFileName,
  validateUpload,
} from "@/security/files";
import {
  ADMIN_ONLY,
  ROLES,
  ROLE_CAPABILITIES,
  assertOwnsStudent,
  assertSameCollege,
  assertSameCompany,
  can,
  primaryRole,
  resolveCompanyScope,
  type Role,
} from "@/security/policy";
import {
  AUDIT_ACTIONS,
  AUDIT_CATALOGUE,
  buildAuditEvent,
  hashIp,
  scrubMetadata,
} from "@/security/audit";

const UUID = "11111111-2222-4333-8444-555555555555";
const OTHER_UUID = "99999999-2222-4333-8444-555555555555";

describe("input validation", () => {
  it("rejects non-uuid identifiers", () => {
    expect(uuidSchema.safeParse(UUID).success).toBe(true);
    expect(uuidSchema.safeParse("1 OR 1=1").success).toBe(false);
    expect(uuidSchema.safeParse("../../etc/passwd").success).toBe(false);
  });

  it("bounds text length and trims", () => {
    const schema = textSchema(10);
    expect(schema.parse("  hello  ")).toBe("hello");
    expect(schema.safeParse("x".repeat(11)).success).toBe(false);
    expect(schema.safeParse("   ").success).toBe(false);
  });

  it("normalises emails and rejects malformed ones", () => {
    expect(emailSchema.parse("  Student@Example.COM ")).toBe("student@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("caps page size and derives a bounded range", () => {
    expect(paginationSchema.safeParse({ page: 3, pageSize: 5_000 }).success).toBe(false);
    expect(paginationSchema.parse({}).pageSize).toBeLessThanOrEqual(MAX_PAGE_SIZE);
    const range = toRange(paginationSchema.parse({ page: 2, pageSize: 25 }));
    expect(range).toEqual({ from: 25, to: 49 });
  });

  it("keeps search terms inert", () => {
    const parsed = searchSchema.safeParse("%_ drop table students; --");
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.length).toBeLessThanOrEqual(120);
  });
});

describe("sanitization", () => {
  it("escapes html so user text can never become markup", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).not.toContain("<img");
  });

  it("strips scripts from stored user text", () => {
    const cleaned = sanitizeUserText("<script>alert('x')</script>Backend engineer");
    expect(cleaned.toLowerCase()).not.toContain("<script");
    expect(cleaned).toContain("Backend engineer");
  });

  it("neutralises csv formula injection", () => {
    expect(sanitizeCsvCell("=cmd|' /c calc'!A1").startsWith("'")).toBe(true);
    expect(sanitizeCsvCell("Analyst")).toBe("Analyst");
  });

  it("never returns internal details to the client", () => {
    const safe = sanitizeError(
      new Error('relation "public.students" does not exist at /app/dist/server.js:12'),
    );
    expect(safe.message).toBe("Something went wrong. Please try again.");
    expect(safe.kind).toBe("internal");
  });

  it("preserves the kind of expected failures", () => {
    expect(
      sanitizeError(new Error("Forbidden: that resource belongs to another organization")).kind,
    ).toBe("forbidden");
  });
});

describe("transport headers", () => {
  it("emits a CSP without unsafe-eval and with framing denied", () => {
    const csp = buildCsp();
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors");
  });

  it("ships the standard hardening headers", () => {
    const headers = securityHeaders();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBeDefined();
    expect(headers["strict-transport-security"]).toBeDefined();
    expect(securityHeaders({ dev: true })["strict-transport-security"]).toBeUndefined();
  });

  it("rejects oversized request bodies", () => {
    expect(isRequestTooLarge(String(MAX_REQUEST_BYTES + 1))).toBe(true);
    expect(isRequestTooLarge("2048")).toBe(false);
    expect(isRequestTooLarge(null)).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks a burst and recovers after the window", () => {
    const limiter = new RateLimiter();
    const policy = RATE_POLICIES.write;
    const key = rateKey("write", UUID, "apply");
    const burst = policy.burst!.limit;

    for (let i = 0; i < burst; i += 1) {
      expect(limiter.check(key, policy, 1_000).allowed).toBe(true);
    }
    expect(limiter.check(key, policy, 1_000).allowed).toBe(false);
    expect(limiter.check(key, policy, 1_000 + policy.burst!.windowMs + 1).allowed).toBe(true);
  });

  it("isolates identities from each other", () => {
    const limiter = new RateLimiter();
    const policy = RATE_POLICIES.auth;
    for (let i = 0; i < policy.limit; i += 1) {
      limiter.check(rateKey("auth", UUID), policy, 1_000 + i);
    }
    expect(limiter.check(rateKey("auth", UUID), policy, 2_000).allowed).toBe(false);
    expect(limiter.check(rateKey("auth", OTHER_UUID), policy, 2_000).allowed).toBe(true);
  });

  it("throws a retryable error from assert", () => {
    const limiter = new RateLimiter();
    const policy = RATE_POLICIES.export;
    for (let i = 0; i < policy.limit; i += 1) limiter.assert("k", policy, 1_000 + i);
    expect(() => limiter.assert("k", policy, 1_100)).toThrow(RateLimitError);
  });
});

describe("file security", () => {
  it("accepts a well-formed resume", () => {
    const { safeName } = validateUpload("resume", {
      name: "Priya Resume 2026.pdf",
      size: 120_000,
      type: "application/pdf",
    });
    expect(safeName).toBe("Priya_Resume_2026.pdf");
  });

  it("rejects disallowed types, oversize files and disguised executables", () => {
    expect(() =>
      validateUpload("resume", { name: "payload.exe", size: 10, type: "application/x-msdownload" }),
    ).toThrow(FileValidationError);
    expect(() =>
      validateUpload("resume", {
        name: "big.pdf",
        size: 50 * 1024 * 1024,
        type: "application/pdf",
      }),
    ).toThrow(FileValidationError);
    expect(() =>
      validateUpload("resume", { name: "resume.pdf", size: 10, type: "text/html" }),
    ).toThrow(FileValidationError);
    expect(() =>
      validateUpload("resume", { name: "empty.pdf", size: 0, type: "application/pdf" }),
    ).toThrow(FileValidationError);
  });

  it("collapses traversal attempts in file names", () => {
    expect(sanitizeFileName("../../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFileName("a/b\\c.pdf")).not.toContain("/");
  });

  it("scopes storage paths to the owner", () => {
    const path = buildStoragePath(UUID, "../../secret.pdf", 1_700_000_000_000);
    expect(path.startsWith(`${UUID}/`)).toBe(true);
    expect(isSafeStoragePath(path)).toBe(true);
    expect(ownsStoragePath(UUID, path)).toBe(true);
    expect(ownsStoragePath(OTHER_UUID, path)).toBe(false);
  });

  it("rejects unsafe stored paths", () => {
    for (const bad of ["/etc/passwd", "a/../../b", "a%2f..%2fb", "onlyone", "a/b/c"]) {
      expect(isSafeStoragePath(bad)).toBe(false);
    }
  });
});

describe("rbac and tenant isolation", () => {
  it("gives every role a capability set and keeps admin-only powers admin-only", () => {
    for (const role of ROLES) expect(ROLE_CAPABILITIES[role].length).toBeGreaterThan(0);
    for (const capability of ADMIN_ONLY) {
      expect(can(["admin"], capability)).toBe(true);
      for (const role of ROLES.filter((r) => r !== "admin")) {
        expect(can([role], capability)).toBe(false);
      }
    }
  });

  it("resolves the highest role", () => {
    expect(primaryRole(["student", "admin"] as Role[])).toBe("admin");
    expect(primaryRole([])).toBe("student");
  });

  it("refuses a claimed company that is not the caller's", () => {
    expect(resolveCompanyScope(UUID, UUID)).toBe(UUID);
    expect(() => resolveCompanyScope(UUID, OTHER_UUID)).toThrow(/another organization|not yours/i);
    expect(() => resolveCompanyScope(null)).toThrow(/company/i);
  });

  it("denies cross-tenant and cross-owner access", () => {
    expect(() => assertSameCompany(UUID, OTHER_UUID)).toThrow();
    expect(() => assertSameCompany(UUID, OTHER_UUID, ["admin"])).not.toThrow();
    expect(() => assertOwnsStudent(UUID, OTHER_UUID)).toThrow();
    expect(() => assertOwnsStudent(UUID, OTHER_UUID, ["placement_officer"])).not.toThrow();
    expect(() => assertSameCollege("PSG Tech", "IIT Madras")).toThrow();
  });
});

describe("audit trail", () => {
  it("has a catalogue entry for every action", () => {
    expect(AUDIT_ACTIONS.length).toBeGreaterThan(20);
    for (const action of AUDIT_ACTIONS) {
      expect(AUDIT_CATALOGUE[action].category).toBeTruthy();
      expect(AUDIT_CATALOGUE[action].severity).toBeTruthy();
    }
  });

  it("marks privilege changes as critical", () => {
    expect(AUDIT_CATALOGUE["user.roles_changed"].severity).toBe("critical");
    expect(AUDIT_CATALOGUE["user.deleted"].severity).toBe("critical");
  });

  it("never persists secrets or free-text content", () => {
    const scrubbed = scrubMetadata({
      password: "hunter2",
      access_token: "abc.def.ghi",
      resume_text: "full resume body",
      cover_note: "please hire me",
      to: "shortlisted",
    });
    expect(scrubbed["password"]).toBe("[redacted]");
    expect(scrubbed["access_token"]).toBe("[redacted]");
    expect(scrubbed["resume_text"]).toBe("[redacted]");
    expect(scrubbed["cover_note"]).toBe("[redacted]");
    expect(scrubbed["to"]).toBe("shortlisted");
  });

  it("builds a row with derived category, severity and hashed ip", () => {
    const row = buildAuditEvent({
      action: "application.status_changed",
      actorId: UUID,
      actorRole: "recruiter",
      entityType: "application",
      entityId: OTHER_UUID,
      ip: "203.0.113.9",
      userAgent: "x".repeat(1_000),
      metadata: { to: "hired" },
    });
    expect(row.category).toBe("application");
    expect(row.severity).toBe("notice");
    expect(row.outcome).toBe("success");
    expect(row.ip_hash).toBe(hashIp("203.0.113.9"));
    expect(row.ip_hash).not.toContain("203.0.113.9");
    expect(row.user_agent!.length).toBeLessThanOrEqual(300);
  });
});
