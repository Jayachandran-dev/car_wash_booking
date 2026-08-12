import { NextResponse } from "next/server";
import { getCurrentUser } from "./auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Require authenticated user. Returns user or a 401 response.
 */
export async function requireAuth(): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}

export function success(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400, details?: any) {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status }
  );
}

export function serverError(err: unknown, context: string) {
  console.error(`${context}:`, err);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}