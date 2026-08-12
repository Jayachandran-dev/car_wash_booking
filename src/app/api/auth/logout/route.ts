import { clearAuthCookie } from "@/lib/auth";
import { success, serverError } from "@/lib/api-helpers";

export async function POST() {
  try {
    await clearAuthCookie();
    return success({ message: "Logged out successfully" });
  } catch (err) {
    return serverError(err, "Logout error");
  }
}