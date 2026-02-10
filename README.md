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


