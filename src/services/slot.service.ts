import { prisma } from "@/lib/prisma";
import { TIME_SLOTS } from "@/lib/validations";
import { isSlotInPast } from "@/lib/datetime";

export async function getAvailableSlots(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00.000Z");

  const existing = await prisma.booking.findMany({
    where: {
      date,
      status: "booked",
    },
    select: { timeSlot: true },
  });

  const bookedSlots = new Set(existing.map((b) => b.timeSlot));

  const available = TIME_SLOTS.filter((slot) => {
    if (bookedSlots.has(slot)) return false;
    if (isSlotInPast(dateStr, slot)) return false;
    return true;
  });

  return {
    date: dateStr,
    availableSlots: available,
    allSlots: TIME_SLOTS,
  };
}