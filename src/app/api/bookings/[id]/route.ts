import { NextRequest } from "next/server";
import { requireAuth, success, error, serverError } from "@/lib/api-helpers";
import { cancelBooking, BookingError } from "@/services/booking.service";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const result = await cancelBooking(id, auth.user.id);

    return success(result);
  } catch (err) {
    if (err instanceof BookingError) {
      return error(err.message, err.status);
    }
    return serverError(err, "Cancel booking error");
  }
}