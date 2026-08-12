/**
 * Unit tests for password hashing / verification.
 * Imports the real functions from src/lib/auth.ts
 */

// Mock Next.js and Prisma so the auth module can be imported in Jest
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { hashPassword, verifyPassword } from "@/lib/auth";

describe("Password hashing and verification (real auth module)", () => {
  it("hashes a password to a non-plaintext bcrypt string", async () => {
    const password = "SecurePass1";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
    expect(hash.length).toBeGreaterThan(50);
  });

  it("verifies the correct password successfully", async () => {
    const password = "SecurePass1";
    const hash = await hashPassword(password);
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const password = "SecurePass1";
    const hash = await hashPassword(password);
    const valid = await verifyPassword("WrongPass2", hash);
    expect(valid).toBe(false);
  });
});