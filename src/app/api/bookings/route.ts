import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { bookingSchema, TIME_SLOTS } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "booked",
        date: { gte: today },
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { carType, package: pkg, date: dateStr, timeSlot } = parsed.data;

    if (!TIME_SLOTS.includes(timeSlot as any)) {
      return NextResponse.json(
        { error: "Invalid time slot" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr + "T00:00:00.000Z");
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    if (date < today) {
      return NextResponse.json(
        { error: "Cannot book a past date" },
        { status: 400 }
      );
    }

    // Use a transaction to enforce no double-booking at query level
    // Unique constraint on (date, timeSlot) provides DB-level protection
    try {
      const booking = await prisma.$transaction(async (tx) => {
        // Check existing active booking for this slot
        const existing = await tx.booking.findFirst({
          where: {
            date,
            timeSlot,
            status: "booked",
          },
        });

        if (existing) {
          throw new Error("SLOT_TAKEN");
        }

        return tx.booking.create({
          data: {
            userId: user.id,
            carType,
            package: pkg,
            date,
            timeSlot,
            status: "booked",
          },
        });
      });

      return NextResponse.json(
        { booking, message: "Booking created successfully" },
        { status: 201 }
      );
    } catch (err: any) {
      if (
        err.message === "SLOT_TAKEN" ||
        (err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002")
      ) {
        return NextResponse.json(
          { error: "This time slot is already booked" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
