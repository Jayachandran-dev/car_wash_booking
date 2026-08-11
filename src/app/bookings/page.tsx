"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  carType: string;
  package: string;
  date: string;
  timeSlot: string;
  status: string;
};

const CAR_TYPES = ["sedan", "suv", "hatchback", "truck", "other"];
const PACKAGES = ["basic", "premium"];

export default function BookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [carType, setCarType] = useState("sedan");
  const [pkg, setPkg] = useState("basic");
  const [timeSlot, setTimeSlot] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          router.push("/login");
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const bookRes = await fetch("/api/bookings");
        if (bookRes.ok) {
          const bookData = await bookRes.json();
          setBookings(bookData.bookings || []);
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function loadSlots(selectedDate: string) {
    setDate(selectedDate);
    setTimeSlot("");
    setAvailableSlots([]);
    if (!selectedDate) return;

    const res = await fetch(`/api/slots?date=${selectedDate}`);
    if (res.ok) {
      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    }
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carType,
          package: pkg,
          date,
          timeSlot,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Booking failed");
        return;
      }

      setSuccess("Booking created!");
      setTimeSlot("");
      // Refresh list and slots
      const bookRes = await fetch("/api/bookings");
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookings(bookData.bookings || []);
      }
      if (date) loadSlots(date);
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setError("");
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Cancel failed");
        return;
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setSuccess("Booking cancelled");
      if (date) loadSlots(date);
    } catch {
      setError("Something went wrong");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return <p className="text-center">Loading...</p>;
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-sm text-gray-600">
            Logged in as {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* New Booking Form */}
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Book a new slot</h2>
        <form onSubmit={handleBook} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => loadSlots(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Time slot</label>
            <select
              required
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              disabled={!date || availableSlots.length === 0}
            >
              <option value="">
                {!date
                  ? "Select a date first"
                  : availableSlots.length === 0
                  ? "No slots available"
                  : "Choose a slot"}
              </option>
              {availableSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Car type</label>
            <select
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {CAR_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Package</label>
            <select
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {PACKAGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting || !timeSlot}
              className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </section>

      {/* Upcoming Bookings */}
      <section className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Upcoming bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500">No upcoming bookings.</p>
        ) : (
          <ul className="divide-y">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <span className="font-medium">
                    {b.date.slice(0, 10)} at {b.timeSlot}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    {b.carType} · {b.package}
                  </span>
                </div>
                <button
                  onClick={() => handleCancel(b.id)}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
