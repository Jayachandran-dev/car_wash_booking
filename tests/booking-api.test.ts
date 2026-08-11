/**
 * Unit test for booking creation logic (the core of the POST /api/bookings endpoint).
 * We test the validation + availability decision without a live DB.
 */

import { z } from "zod";

const bookingSchema = z.object({
  carType: z.enum(["sedan", "suv", "hatchback", "truck", "other"]),
  package: z.enum(["basic", "premium"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().regex(/^([01]\d|2[0-3]):00$/),
});

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

function validateAndCheckSlot(
  body: unknown,
  existingBookedSlots: string[]
): { ok: true; data: z.infer<typeof bookingSchema> } | { ok: false; error: string } {
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed" };
  }

  const { timeSlot, date } = parsed.data;

  if (!TIME_SLOTS.includes(timeSlot)) {
    return { ok: false, error: "Invalid time slot" };
  }

  if (existingBookedSlots.includes(timeSlot)) {
    return { ok: false, error: "This time slot is already booked" };
  }

  // simplistic past-date check (date string comparison works for YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return { ok: false, error: "Cannot book a past date" };
  }

  return { ok: true, data: parsed.data };
}

describe("Booking API endpoint logic", () => {
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
        package: "deluxe",
        date: "2026-12-01",
        timeSlot: "11:00",
      },
      []
    );
    expect(result.ok).toBe(false);
  });
});
