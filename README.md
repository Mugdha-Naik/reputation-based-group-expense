# SettleSmart

SettleSmart is a full-stack group expense management application built to make shared payments clearer, faster, and more accountable.

Instead of stopping at expense splitting, the product also supports settlement tracking, invite-by-link and QR onboarding, user profiles with UPI details, and a reputation model that reflects payment behavior over time.

## Features

- Email/password and Google authentication with NextAuth
- Create groups and automatically add the creator as the first member
- Join groups through shareable links and QR codes
- Group member management and per-group trip workspace
- Manual expense creation with participant selection
- Bill upload flow for UPI and cash entries
- Settlement generation from the expense ledger
- Mark settlements as completed and update user reputation
- User profile management with UPI ID and avatar URL
- Reputation leaderboard across registered users
- Protected group-scoped APIs with membership checks
- PWA manifest support for installable app metadata

## Product Flow

1. Register or sign in
2. Create a group
3. Invite members through a join link or QR code
4. Add expenses inside the group trip page
5. Generate or refresh settlements from the shared ledger
6. Complete payments and update reputation automatically

## Architecture

### Frontend

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS

### Backend

- Next.js Route Handlers
- NextAuth for authentication and session management
- MongoDB with Mongoose models

### Core Domain Models

- `User`
  Stores account details, profile image, UPI ID, and reputation score
- `Group`
  Stores the creator and list of members
- `Expense`
  Acts as the source-of-truth ledger for shared expenses
- `Settlement`
  Stores pending and completed obligations derived from the expense ledger
- `Notification`
  Stores group expense notifications for affected users

### Key Backend Design Decisions

- Expenses are treated as the permanent ledger
- Pending settlements are rebuilt from expenses instead of being maintained by multiple conflicting flows
- Completed settlements act as payment history that influences outstanding balances
- Group-scoped APIs require both authentication and membership authorization

## Project Structure

```text
app/
  api/                 Route handlers for auth, groups, expenses, settlements, profile
  dashboard/           Authenticated dashboard view
  groups/              Group list, create flow, and group detail pages
  join/                Join group flow
  profile/             User profile page
  trip/                Group trip and settlement workspace
  users/               Reputation leaderboard
components/            Reusable UI building blocks
lib/                   Business logic, auth config, DB connection, settlement rebuild logic
models/                Mongoose schemas
public/                Static assets and PWA manifest
```

## Screenshots

Add real screenshots before sharing the repository publicly or linking it on your resume. Recommended captures:

- Landing page
- Dashboard with multiple groups
- Group invite QR modal
- Trip page with balances, expense entry, and settlement history
- Profile page with reputation and UPI details

Suggested file names:

- `public/screenshots/landing.png`
- `public/screenshots/dashboard.png`
- `public/screenshots/invite-qr.png`
- `public/screenshots/trip-flow.png`
- `public/screenshots/profile.png`

Example markdown to use after adding images:

```md
![Landing Page](public/screenshots/landing.png)
![Dashboard](public/screenshots/dashboard.png)
![Trip Flow](public/screenshots/trip-flow.png)
```

## Setup

### Prerequisites

- Node.js 18+
- npm
- Docker Desktop optional, for team setup
- Google OAuth credentials if using Google sign-in

### Environment Variables

Create a local env file based on `.env.example`.

Use `.env.local` for local development and keep real secrets out of Git.

Required variables:

- `MONGODB_URI`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Example:

```env
MONGODB_URI=mongodb://localhost:27017/reputation-group-expense
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Docker Setup

Docker is useful if you are working with teammates and want the same app and MongoDB setup across machines.

### Files Used

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `.env.example`

### Start With Docker

1. Install Docker Desktop
2. Create `.env.local` or `.env` using `.env.example`
3. Make sure your Docker file is named exactly `Dockerfile`
4. Run:

```bash
docker compose up --build
```

5. Open `http://localhost:3000`

### What Docker Starts

- `app`
  Runs the Next.js application on port `3000`
- `mongo`
  Runs MongoDB on port `27017`

### Notes For Teammates

- Use placeholder values in `.env.example`
- Put real secrets only in `.env.local` or your deployment environment
- If you use Google sign-in locally, make sure your Google OAuth app allows `http://localhost:3000`

### Quality Checks

```bash
npm run lint
npm run build
npm run test:split
node --test --experimental-strip-types lib/settlementLedger.test.ts
```

## Implemented Technical Highlights

- Built secure credential and Google authentication using NextAuth and MongoDB-backed user records
- Added protected route handling and membership checks for group-scoped APIs
- Refactored settlement generation so the expense ledger is the single source of truth
- Added reputation updates based on completed and pending payment behavior
- Improved UX with better loading, empty, and error states on key authenticated pages

## Challenges Solved

### 1. Avoiding settlement drift

Initial flows could create pending settlements in more than one place, which risked inconsistencies. This was resolved by rebuilding pending settlements from the expense ledger through a shared backend path.

### 2. Protecting group data

Group members, settlements, and expense history should not be visible to non-members. Group-scoped endpoints were hardened with session and membership validation.

### 3. Improving real-user resilience

Several pages originally relied on raw fetch failures or alerts. Loading, empty, and error states were added so the app behaves predictably for real users.

## Future Scope

- Receipt OCR and auto-fill for expense entry
- Smarter payment reminders and behavioral insights
- Better notification center and read/unread actions
- Expanded automated test coverage for route handlers
- True offline support and richer PWA behavior
- Production deployment with seeded demo data and polished screenshots

## Resume Positioning

This project is strong to present as:

- A full-stack Next.js product with authentication, protected APIs, and MongoDB persistence
- A fintech-adjacent shared-expense platform with real business logic
- A product-focused engineering project that combines UX, backend correctness, and data consistency
