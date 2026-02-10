# Group Expense & Settlement Management PWA

> A smarter way to manage shared expenses with accountability and trust.

PROBLEM STATEMENT

Managing shared expenses in groups often leads to confusion, delayed payments, and disputes. Existing expense-splitting applications mainly focus on calculations and lack mechanisms for long-term accountability and trust.

There is a need for a system that not only splits expenses accurately but also tracks payment behavior over time and promotes responsible participation in group settlements.

SOLUTION OVERVIEW

Our solution is a full-stack PWA that:
- Simplifies group expense tracking
- Ensures transparent settlement calculations
- Introduces a reputation score to promote accountability
- Provides a scalable foundation for advanced features such as OCR-based receipt scanning and payment insights

PHASE - 1

Phase-1 focuses on building a functional and demonstrable MVP with the following features:

- Group / Trip creation
- Member management
- Manual expense entry
- Equal expense splitting
- Settlement summary generation
- Simulated reputation score system
- Basic PWA setup

TECH STACK

- Frontend:
- Next.js (React)
- TypeScript
- Tailwind CSS

State Management:
- Zustand

Backend (Phase-1):
- Next.js API Routes (Mock backend)

Future Integrations:
- OCR for receipt scanning
- UPI deep-link payment tracking
- Fraud and misuse detection

PROJECT STRUCTURE

src/
├── app/            # Pages and API routes
├── components/     # Reusable UI components
├── lib/            # Business logic (split calculations)
├── models/         # Data models
├── store/          # Global state management

HOW TO RUN THE PROJECT LOCALLY

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
1. Clone the repository
   git clone https://github.com/your-username/group-expense-pwa.git

2. Navigate to the project folder
   cd group-expense-pwa

3. Install dependencies
   npm install

4. Run the development server
   npm run dev

5. Open http://localhost:3000 in your browser

TEAM COLLABORATION GUIDELINES

- The `main` branch contains stable demo-ready code
- All development should be done on feature branches
- Pull requests must be reviewed before merging


FUTURE SCOPE

- OCR-based receipt scanning
- Persistent reputation score across groups
- UPI deep-link and payment confirmation tracking
- Fraud prevention and misuse detection
- Analytics on payment behavior
- Migration to production-ready backend



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
