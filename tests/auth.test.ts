import bcrypt from "bcryptjs";

// Pure unit tests for password hashing / verification logic
// (mirrors src/lib/auth.ts without Next.js dependencies)

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

describe("Password hashing and verification", () => {
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
