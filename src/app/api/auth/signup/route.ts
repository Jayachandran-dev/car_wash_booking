import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { success, error, serverError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
      select: { id: true, email: true, name: true },
    });

    const token = await createToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return success(
      { user, message: "Account created successfully" },
      201
    );
  } catch (err) {
    return serverError(err, "Signup error");
  }
}