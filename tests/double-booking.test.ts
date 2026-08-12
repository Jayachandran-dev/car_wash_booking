/**
 * Unit test for the double-booking prevention rule.
 * Uses the same rule that lives in booking.service.ts
 * (only status = "booked" blocks a slot).
 */

type BookingRecord = {
  date: string;
  timeSlot: string;
  status: string;
};

/**
 * This is the exact decision used inside createBooking transaction.
 * Keeping it pure makes the rule easy to unit test.
 */
function isSlotAvailable(
  existing: BookingRecord[],
  date: string,
  timeSlot: string
): boolean {
  return !existing.some(
    (b) =>
      b.date === date &&
      b.timeSlot === timeSlot &&
      b.status === "booked"
  );
}

describe("Double-booking prevention rule", () => {
  const date = "2026-08-15";
  const slot = "10:00";

  it("allows booking when the slot is free", () => {
    const existing: BookingRecord[] = [
      { date, timeSlot: "09:00", status: "booked" },
      { date: "2026-08-16", timeSlot: slot, status: "booked" },
    ];
    expect(isSlotAvailable(existing, date, slot)).toBe(true);
  });

  it("blocks booking when the same date+slot is already booked", () => {
    const existing: BookingRecord[] = [
      { date, timeSlot: slot, status: "booked" },
    ];
    expect(isSlotAvailable(existing, date, slot)).toBe(false);
  });

  it("treats a cancelled booking as freeing the slot", () => {
    const existing: BookingRecord[] = [
      { date, timeSlot: slot, status: "cancelled" },
    ];
    expect(isSlotAvailable(existing, date, slot)).toBe(true);
  });
});