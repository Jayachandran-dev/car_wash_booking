/**
 * All date/time helpers for the car wash booking system.
 * Business timezone: Asia/Kolkata (IST = UTC+5:30)
 */

export const BUSINESS_TIMEZONE_OFFSET = "+05:30";

/**
 * Create a Date representing dateStr + timeSlot in IST.
 * Example: getSlotDateTimeIST("2026-08-12", "09:00")
 */
export function getSlotDateTimeIST(dateStr: string, timeSlot: string): Date {
  return new Date(`${dateStr}T${timeSlot}:00${BUSINESS_TIMEZONE_OFFSET}`);
}

/**
 * Get today's date at midnight UTC (for Prisma @db.Date comparisons)
 */
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Convert a Date (from DB) to YYYY-MM-DD string
 */
export function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a slot (date + time) is already in the past (IST)
 */
export function isSlotInPast(dateStr: string, timeSlot: string): boolean {
  const slotTime = getSlotDateTimeIST(dateStr, timeSlot);
  return slotTime <= new Date();
}

/**
 * Check if a booking datetime is already in the past
 */
export function isBookingInPast(date: Date, timeSlot: string): boolean {
  const dateStr = toDateString(date);
  return isSlotInPast(dateStr, timeSlot);
}