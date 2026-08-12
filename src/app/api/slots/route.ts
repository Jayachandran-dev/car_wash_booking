import { NextRequest } from "next/server";
import { requireAuth, success, error, serverError } from "@/lib/api-helpers";
import { getAvailableSlots } from "@/services/slot.service"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const dateStr = new URL(req.url).searchParams.get("date");

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return error("Valid date (YYYY-MM-DD) is required");
    }

    const result = await getAvailableSlots(dateStr);
    return success(result);
  } catch (err) {
    return serverError(err, "Slots error");
  }
}