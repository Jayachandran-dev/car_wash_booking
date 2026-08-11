import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Car Wash Booking System
      </h1>
      <p className="text-lg text-gray-600">
        Book a convenient time slot for a basic or premium wash. Secure
        authentication and conflict-free scheduling.
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Login
        </Link>
      </div>
      <div className="mt-12 rounded-lg border bg-white p-6 text-left shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">How it works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-gray-700">
          <li>Create an account or log in</li>
          <li>Choose a date and see available 1-hour slots (9 AM – 5 PM)</li>
          <li>Select car type and wash package</li>
          <li>Confirm — double-booking is prevented at the database level</li>
          <li>View or cancel your upcoming bookings anytime</li>
        </ol>
      </div>
    </div>
  );
}
