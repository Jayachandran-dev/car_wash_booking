# Car Wash Booking System (Prototype)

Small full-stack application demonstrating secure authentication and conflict-free booking/scheduling for a car wash service.

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS (minimal styling)
- **Backend**: Next.js Route Handlers (Node.js / TypeScript)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT stored in HTTP-only cookies + bcrypt password hashing
- **Validation**: Zod
- **Tests**: Jest (3 unit tests covering the required areas)

## Architecture

The codebase follows a clean layered structure to keep business logic separate from HTTP handling and to avoid duplication (DRY):


## Folder structure
src/
├── app/api/                 # Thin route handlers (controllers)
├── services/                # Business logic layer
│   ├── booking.service.ts
│   └── slot.service.ts
├── lib/                     # Shared utilities
│   ├── auth.ts              # Password hashing, JWT, cookies
│   ├── datetime.ts          # IST timezone helpers
│   ├── api-helpers.ts       # requireAuth, success/error responders
│   ├── validations.ts       # Zod schemas
│   └── prisma.ts
└── middleware.ts            # Route protection



**Key design decisions:**
- Route handlers stay thin — they only parse input, call a service, and return a response.
- All booking rules (past slot check, double-booking prevention, cancel rules) live in the service layer.
- Shared helpers (`requireAuth`, `success`, `error`, IST date utilities) eliminate repeated code across routes.

### Why this backend choice?

Node.js / TypeScript inside Next.js was chosen over a separate Express or Python service because:

- The task is a small prototype; a monorepo reduces moving parts, CORS, and type duplication.
- Route Handlers + middleware give clean protected APIs and pages.
- Shared Zod schemas and TypeScript types between client and server reduce bugs.
- Easy local development (`npm run dev` starts everything).

A dedicated Express backend would be preferred for a larger multi-client system or when the API needs to be consumed by non-Next clients.

### Auth strategy: JWT vs server-side sessions

**Chosen: JWT in HTTP-only cookies.**

| Aspect                    | JWT (chosen)                          | Server sessions                     |
|---------------------------|---------------------------------------|-------------------------------------|
| State                     | Stateless                             | Requires session store (Redis/DB)   |
| Scaling                   | Easy horizontal scaling               | Sticky sessions or shared store     |
| Revocation                | Harder (need short expiry / blacklist)| Easy (delete session)               |
| Complexity for this task  | Low                                   | Extra infrastructure                |

For a prototype with no logout-everywhere requirement and a single server, JWT keeps the surface area small while still protecting routes via middleware. Tokens expire after 7 days. Cookies are `httpOnly` + `sameSite=lax` to mitigate XSS/CSRF basics.

## Database schema

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String?
  bookings     Booking[]
  ...
}

model Booking {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  carType   String
  package   String   // basic | premium
  date      DateTime @db.Date
  timeSlot  String   // "09:00" .. "17:00"
  status    String   @default("booked")
  ...

  @@unique([date, timeSlot])   // DB-level double-booking prevention
}
```

**Why modelled this way?**

- One-to-many User → Booking with cascade on delete.
- `@@unique([date, timeSlot])` enforces that two active bookings cannot share the same slot at the database level (Prisma raises P2002 on conflict). Combined with an explicit check inside a transaction, this satisfies the “enforced at the database/query level” requirement.
- On cancel we **delete** the row so the unique constraint immediately frees the slot for re-booking. (A partial unique index on `WHERE status = 'booked'` would be the production refinement.)
- Fixed 1-hour slots 09:00–17:00 are generated in application code; only free ones are returned by `/api/slots`.
All time comparisons use IST (Asia/Kolkata) so past slots are correctly blocked for Indian users.

## Setup (local)

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or Docker)

### 1. Clone & install

```bash
git clone <repo-url>
cd car-wash-booking   # or the folder name you used
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
```

Example `DATABASE_URL`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/carwash?schema=public"
```

### 3. Database

```bash
npx prisma migrate dev --name init
# or: npx prisma db push
npx prisma generate
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### 5. Tests

```bash
npm test
```

## API overview

| Method | Path                     | Auth | Description                    |
|--------|--------------------------|------|--------------------------------|
| POST   | /api/auth/signup         | No   | Create account + set JWT cookie|
| POST   | /api/auth/login          | No   | Login + set JWT cookie         |
| POST   | /api/auth/logout         | No   | Clear cookie                   |
| GET    | /api/auth/me             | Yes  | Current user                   |
| GET    | /api/slots?date=YYYY-MM-DD | Yes | Available slots for day      |
| GET    | /api/bookings            | Yes  | My upcoming bookings           |
| POST   | /api/bookings            | Yes  | Create booking                 |
| DELETE | /api/bookings/:id        | Yes  | Cancel (future only)           |

## What I’d do differently with more time

- Partial unique index (`WHERE status = 'booked'`) so soft-cancelled rows keep history while still freeing slots.
- Refresh tokens + short-lived access tokens.
- Proper rate limiting and CSRF protection beyond `sameSite`.
- Docker Compose for one-command Postgres + app.
- E2E tests (Playwright) for the full booking flow.
- Admin view of all bookings / slot management.
- Email/WhatsApp - confirmation / reminders.

## AI tooling

- Used AI assistance for boilerplate generation (Next.js structure, Prisma schema drafts, test skeletons) and for iterating on the double-booking transaction pattern.
- Every generated snippet was reviewed, type-checked, and adjusted (especially auth cookie handling, middleware matcher, and the unique-constraint + transaction combination). The three unit tests were written and verified against the pure logic they target.

---

**Not expected / out of scope**: visual polish, production deployment, email, payments, multi-bay support.
