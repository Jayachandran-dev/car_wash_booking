import { prisma } from "@/lib/prisma";
import { TIME_SLOTS } from "@/lib/validations";
import {
  getTodayUTC,
  isSlotInPast,
  isBookingInPast,
} from "@/lib/datetime";
import { Prisma } from "@prisma/client";

export class BookingError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export async function listUpcomingBookings(userId: string) {
  const today = getTodayUTC();

  return prisma.booking.findMany({
    where: {
      userId,
      status: "booked",
      date: { gte: today },
    },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
  });
}

export async function createBooking(params: {
  userId: string;
  carType: string;
  package: string;
  dateStr: string;
  timeSlot: string;
}) {
  const { userId, carType, package: pkg, dateStr, timeSlot } = params;

  if (!TIME_SLOTS.includes(timeSlot as any)) {
    throw new BookingError("Invalid time slot");
  }

  const date = new Date(dateStr + "T00:00:00.000Z");
  const today = getTodayUTC();

  if (date < today) {
    throw new BookingError("Cannot book a past date");
  }

  if (isSlotInPast(dateStr, timeSlot)) {
    throw new BookingError("Cannot book a time slot that has already passed");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          date,
          timeSlot,
          status: "booked",
        },
      });

      if (existing) {
        throw new BookingError("This time slot is already booked", 409);
      }

      return tx.booking.create({
        data: {
          userId,
          carType,
          package: pkg,
          date,
          timeSlot,
          status: "booked",
        },
      });
    });
  } catch (err: any) {
    if (err instanceof BookingError) throw err;

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new BookingError("This time slot is already booked", 409);
    }

    throw err;
  }
}

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new BookingError("Booking not found", 404);
  }

  if (booking.userId !== userId) {
    throw new BookingError("Forbidden", 403);
  }

  if (booking.status === "cancelled") {
    throw new BookingError("Booking already cancelled");
  }

  if (isBookingInPast(booking.date, booking.timeSlot)) {
    throw new BookingError(
      "Cannot cancel a booking that has already occurred"
    );
  }

  await prisma.booking.delete({
    where: { id: bookingId },
  });

  return { message: "Booking cancelled successfully" };
}