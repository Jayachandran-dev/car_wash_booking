/**
 * Unit test for booking creation validation + slot conflict logic.
 * Uses the real Zod schema and TIME_SLOTS from src/lib/validations.
 */

import { bookingSchema, TIME_SLOTS } from "@/lib/validations";

function validateAndCheckSlot(
  body: unknown,
  existingBookedSlots: string[]
): { ok: true; data: any } | { ok: false; error: string } {
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return { ok: false, error: "Validation failed" };
  }

  const { timeSlot, date } = parsed.data;

  if (!TIME_SLOTS.includes(timeSlot as any)) {
    return { ok: false, error: "Invalid time slot" };
  }

  if (existingBookedSlots.includes(timeSlot)) {
    return { ok: false, error: "This time slot is already booked" };
  }

  // Simple past-date check
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return { ok: false, error: "Cannot book a past date" };
  }

  return { ok: true, data: parsed.data };
}

describe("Booking API endpoint logic (real validations)", () => {
  it("accepts a valid free slot", () => {
    const result = validateAndCheckSlot(
      {
        carType: "sedan",
        package: "basic",
        date: "2026-12-01",
        timeSlot: "11:00",
      },
      ["09:00", "10:00"]
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.timeSlot).toBe("11:00");
    }
  });

  it("rejects an already booked slot", () => {
    const result = validateAndCheckSlot(
      {
        carType: "suv",
        package: "premium",
        date: "2026-12-01",
        timeSlot: "10:00",
      },
      ["09:00", "10:00"]
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/already booked/);
    }
  });

  it("rejects invalid package", () => {
    const result = validateAndCheckSlot(
      {
        carType: "sedan",
        package: "deluxe", // invalid
        date: "2026-12-01",
        timeSlot: "11:00",
      },
      []
    );

    expect(result.ok).toBe(false);
  });

  it("rejects past dates", () => {
    const result = validateAndCheckSlot(
      {
        carType: "sedan",
        package: "basic",
        date: "2020-01-01",
        timeSlot: "11:00",
      },
      []
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/past date/);
    }
  });
});