import { NextRequest } from "next/server";
import { requireAuth, success, error, serverError } from "@/lib/api-helpers";
import { bookingSchema } from "@/lib/validations";
import {
  listUpcomingBookings,
  createBooking,
  BookingError,
} from "@/services/booking.service";

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const bookings = await listUpcomingBookings(auth.user.id);
    return success({ bookings });
  } catch (err) {
    return serverError(err, "List bookings error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return error("Validation failed", 400, parsed.error.flatten());
    }

    const { carType, package: pkg, date: dateStr, timeSlot } = parsed.data;

    const booking = await createBooking({
      userId: auth.user.id,
      carType,
      package: pkg,
      dateStr,
      timeSlot,
    });

    return success({ booking, message: "Booking created successfully" }, 201);
  } catch (err) {
    if (err instanceof BookingError) {
      return error(err.message, err.status);
    }
    return serverError(err, "Create booking error");
  }
}