import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TIME_SLOTS } from "@/lib/validations";

// Helper: create a Date for a given date + timeSlot in IST (Asia/Kolkata)
function getSlotDateTimeIST(dateStr: string, timeSlot: string): Date {
  // Example: "2026-08-12" + "09:00" → 2026-08-12T09:00:00+05:30
  return new Date(`${dateStr}T${timeSlot}:00+05:30`);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: "Valid date (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr + "T00:00:00.000Z");

    // Only consider active (booked) slots
    const existing = await prisma.booking.findMany({
      where: {
        date,
        status: "booked",
      },
      select: { timeSlot: true },
    });

    const bookedSlots = new Set(existing.map((b) => b.timeSlot));
    const now = new Date();

    const available = TIME_SLOTS.filter((slot) => {
      if (bookedSlots.has(slot)) return false;

      // Block past slots using IST time
      const slotTime = getSlotDateTimeIST(dateStr, slot);
      if (slotTime <= now) return false;

      return true;
    });

    return NextResponse.json({
      date: dateStr,
      availableSlots: available,
      allSlots: TIME_SLOTS,
    });
  } catch (error) {
    console.error("Slots error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}