-- Equivalent schema for reviewers who prefer raw SQL
-- Run after creating the database: psql -d carwash -f prisma/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name          TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id         TEXT PRIMARY KEY,
  "userId"   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "carType"  TEXT NOT NULL,
  package    TEXT NOT NULL,
  date       DATE NOT NULL,
  "timeSlot" TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'booked',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT unique_active_slot UNIQUE (date, "timeSlot")
);

CREATE INDEX IF NOT EXISTS bookings_userId_idx ON bookings("userId");
CREATE INDEX IF NOT EXISTS bookings_date_status_idx ON bookings(date, status);
