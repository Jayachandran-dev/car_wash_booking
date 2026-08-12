import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { success, error, serverError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error("Invalid email or password", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password", 401);
    }

    const token = await createToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return success({
      user: { id: user.id, email: user.email, name: user.name },
      message: "Logged in successfully",
    });
  } catch (err) {
    return serverError(err, "Login error");
  }
}