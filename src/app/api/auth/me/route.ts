import { requireAuth, success, serverError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    return success({ user: auth.user });
  } catch (err) {
    return serverError(err, "Me error");
  }
}