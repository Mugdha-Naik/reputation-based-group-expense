"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileMenu from "@/components/ProfileMenu";

const steps = [
  {
    title: "Create a group",
    description: "Start a trip, flat, or event group and invite everyone in a few taps.",
  },
  {
    title: "Add expenses",
    description: "Record who paid, include participants, and keep the split visible to everyone.",
  },
  {
    title: "Generate settlements",
    description: "Turn balances into clear pay-to-pay instructions instead of messy manual math.",
  },
  {
    title: "Track completion",
    description: "Mark payments as completed and keep your group aligned on what is still pending.",
  },
];

const benefits = [
  "Clear balances for every member",
  "Settlement history for each group",
  "Invite flow with shareable join links",
  "Built for accountability, not just calculation",
];

const previewBalances = [
  { name: "Mugdha", amount: "+INR 420", tone: "text-green-400" },
  { name: "Aarav", amount: "-INR 170", tone: "text-red-400" },
  { name: "Neha", amount: "-INR 250", tone: "text-red-400" },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const primaryHref = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel =
    status === "loading" ? "Loading..." : isLoggedIn ? "Go to Dashboard" : "Get Started";
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_28%)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-lg font-semibold tracking-tight">SettleSmart</p>
              <p className="text-xs text-gray-400">Group expense tracking with accountability</p>
            </div>

            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-200 transition hover:border-white hover:text-white"
              >
                Login
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
              >
                {isLoggedIn ? "Dashboard" : "Register"}
              </Link>
              <ProfileMenu />
            </nav>
          </header>

          <div className="grid gap-10 py-14 sm:py-18 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-300">
                Shared money, made clear
              </div>

              <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Split group expenses without the confusion.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
                Create groups, add expenses, see who owes whom, and settle payments with a flow
                your whole group can understand.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHref}
                  className="rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-black transition hover:bg-gray-200"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-xl border border-gray-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-white"
                >
                  How It Works
                </Link>
              </div>

              <div className="mt-8 grid gap-3 text-sm text-gray-300 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
                  <p className="text-2xl font-semibold text-white">Groups</p>
                  <p className="mt-1">Trips, roommates, events, clubs</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
                  <p className="text-2xl font-semibold text-white">Settlements</p>
                  <p className="mt-1">Clear pending and completed payment flow</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950/80 p-4">
                  <p className="text-2xl font-semibold text-white">Trust</p>
                  <p className="mt-1">Built around transparency and accountability</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 hidden h-28 w-28 rounded-full bg-blue-500/10 blur-3xl sm:block" />
              <div className="absolute -right-6 bottom-0 hidden h-28 w-28 rounded-full bg-green-500/10 blur-3xl sm:block" />

              <div className="relative rounded-[28px] border border-gray-800 bg-gray-950 p-4 shadow-2xl shadow-black/40 sm:p-5">
                <div className="rounded-2xl border border-gray-800 bg-black p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Goa Trip 2026</p>
                      <p className="text-xs text-gray-400">6 members | 14 expenses</p>
                    </div>
                    <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300">
                      Active
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                          Next settlement
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          Aarav pays Mugdha INR 170
                        </p>
                      </div>
                      <span className="rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-medium text-blue-300">
                        Pending
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Balances</p>
                    <div className="mt-3 space-y-3">
                      {previewBalances.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-200">{entry.name}</span>
                          <span className={`font-medium ${entry.tone}`}>{entry.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Invite</p>
                      <p className="mt-2 text-sm text-gray-200">
                        Share a join link or QR so members can enter the group quickly.
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        Payment flow
                      </p>
                      <p className="mt-2 text-sm text-gray-200">
                        Mark settlements as paid and keep the group history visible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            A simple flow your whole group can follow.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-gray-800 bg-gray-950 p-5"
            >
              <p className="text-sm font-medium text-blue-300">0{index + 1}</p>
              <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-900 bg-gray-950/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-green-300">
              Why this app
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              More than just a calculator.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-gray-300">
              The product already focuses on real group coordination: not just splitting numbers,
              but showing balances clearly, guiding settlements, and creating a more accountable
              shared-expense experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="rounded-2xl border border-gray-800 bg-black p-5 text-sm text-gray-200"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-300">
          Ready to start
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Bring order to your next shared expense.
        </h2>
        <p className="mt-5 text-base leading-7 text-gray-300">
          Create your account, open a group, and let the app handle the messy part of who owes
          whom.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            {isLoggedIn ? "Open Dashboard" : "Create Your First Group"}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-gray-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-white"
          >
            Login to Continue
          </Link>
        </div>
      </section>
    </main>
  );
}
