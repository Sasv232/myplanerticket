import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle and pg
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-token"),
    verify: vi.fn().mockReturnValue({ sub: "user_123" }),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("12345678-1234-1234-1234-123456789abc"),
}));

describe("Auth functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hashPassword returns hashed string", async () => {
    const { hashPassword } = await import("@/lib/auth");
    const hash = await hashPassword("password123");
    expect(hash).toBe("hashed-password");
  });

  it("verifyPassword returns true for matching password", async () => {
    const { verifyPassword } = await import("@/lib/auth");
    const valid = await verifyPassword("password123", "hashed-password");
    expect(valid).toBe(true);
  });

  it("createJwtToken returns a token string", async () => {
    const { createJwtToken } = await import("@/lib/auth");
    const token = createJwtToken("user_123");
    expect(token).toBe("mock-token");
  });

  it("verifyJwtToken returns decoded token", async () => {
    const { verifyJwtToken } = await import("@/lib/auth");
    const decoded = verifyJwtToken("some-token");
    expect(decoded).toEqual({ sub: "user_123" });
  });

  it("generateSessionToken returns a long string", async () => {
    const { generateSessionToken } = await import("@/lib/auth");
    const token = generateSessionToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });
});
