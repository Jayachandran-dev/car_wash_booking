import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Car Wash Booking",
  description: "Book your car wash slot online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <a href="/" className="text-xl font-semibold tracking-tight">
              CarWash Booker
            </a>
            <nav className="flex gap-4 text-sm">
              <a href="/bookings" className="hover:underline">
                My Bookings
              </a>
              <a href="/login" className="hover:underline">
                Login
              </a>
              <a href="/signup" className="hover:underline">
                Sign up
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
