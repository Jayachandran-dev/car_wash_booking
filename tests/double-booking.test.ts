/**
 * Unit test for the double-booking prevention rule.
 * We simulate the check that runs inside the booking transaction.
 */

type BookingRecord = {
  date: string;
  timeSlot: string;
  status: string;
};

function isSlotAvailable(
  existing: BookingRecord[],
  date: string,
  timeSlot: string
): boolean {
  return !existing.some(
    (b) => b.date === date && b.timeSlot === timeSlot && b.status === "booked"
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
