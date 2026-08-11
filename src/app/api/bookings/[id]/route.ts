import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Booking already cancelled" },
        { status: 400 }
      );
    }

    // Check if the slot has already occurred
    const now = new Date();
    const bookingDateTime = new Date(booking.date);
    const [hours] = booking.timeSlot.split(":").map(Number);
    bookingDateTime.setUTCHours(hours, 0, 0, 0);

    if (bookingDateTime <= now) {
      return NextResponse.json(
        { error: "Cannot cancel a booking that has already occurred" },
        { status: 400 }
      );
    }

    // Delete on cancel so the unique(date, timeSlot) constraint frees the slot
    // for future bookings. (Status-based soft delete would require a partial
    // unique index which we can add with more time.)
    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
