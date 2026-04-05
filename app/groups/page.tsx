"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface GroupMember {
  _id: string;
  name: string;
  image?: string;
}

interface LatestExpense {
  title: string;
  amount: number;
  paidBy: string;
  createdAt?: string;
}

interface GroupSummary {
  _id: string;
  name: string;
  createdAt?: string;
  members: GroupMember[];
  totalExpense?: number;
  expenseCount?: number;
  latestExpense?: LatestExpense | null;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getGreetingName(fullName?: string | null) {
  if (!fullName?.trim()) return "Nancy";
  return fullName.trim().split(/\s+/)[0];
}

function formatCreatedDate(date?: string) {
  if (!date) return "Recently created";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getRelativeTime(date?: string) {
  if (!date) return "just now";

  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getGroupStatus(group: GroupSummary) {
  return (group.totalExpense || 0) > 0 ? "Active" : "Settled";
}

function getLastActivity(group: GroupSummary) {
  if (!group.latestExpense) {
    return "No recent activity yet";
  }

  return `${group.latestExpense.paidBy || group.latestExpense.title} added ${currency.format(
    group.latestExpense.amount
  )} • ${getRelativeTime(group.latestExpense.createdAt)}`;
}

function RingStat({
  score,
}: {
  score: number;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative h-16 w-16">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeLinecap="round"
          strokeWidth="6"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 0.6s ease",
          }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
        {score}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reputationScore, setReputationScore] = useState(session?.user?.reputationScore ?? 97);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError("");

        const [groupsRes, reputationRes] = await Promise.all([
          fetch("/api/groups/my", { credentials: "include" }),
          fetch("/api/reputation", { credentials: "include" }),
        ]);
        const data = await groupsRes.json();

        if (!groupsRes.ok) {
          throw new Error(data?.message || "Failed to fetch groups");
        }

        if (reputationRes.ok) {
          const reputationData = await reputationRes.json();
          if (typeof reputationData?.score === "number") {
            setReputationScore(reputationData.score);
          }
        }

        setGroups(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [router, status]);

  const greetingName = getGreetingName(session?.user?.name);

  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalExpenses = groups.reduce((sum, group) => sum + (group.totalExpense || 0), 0);

    return {
      totalGroups,
      totalExpenses,
      reputationScore,
    };
  }, [groups, reputationScore]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_28%),linear-gradient(180deg,#07111f_0%,#0f172a_48%,#111827_100%)] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-32 rounded-[32px] bg-white/8" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 rounded-full bg-white/8" />
            <div className="h-24 rounded-full bg-white/8" />
            <div className="h-24 rounded-full bg-white/8" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 rounded-[32px] bg-white/8" />
            <div className="h-72 rounded-[32px] bg-white/8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_26%),radial-gradient(circle_at_right,_rgba(139,92,246,0.12),_transparent_24%),linear-gradient(180deg,#07111f_0%,#0f172a_46%,#111827_100%)] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/6 px-6 py-6 shadow-[0_24px_90px_rgba(2,6,23,0.36)] backdrop-blur-xl sm:px-8 sm:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.16),_transparent_22%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Your Groups
              </p>
              <p className="mt-2 text-sm text-slate-300">Welcome back, {greetingName}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-[28px] border border-white/12 bg-slate-950/35 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.28)]">
                <div className="flex items-center gap-3">
                  <RingStat score={reputationScore} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Reputation
                    </p>
                    <p className="mt-1 text-sm font-medium text-white">{reputationScore}/100</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/groups/create")}
                className="rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(99,102,241,0.34)]"
              >
                + Create Group
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="group rounded-full border border-white/10 bg-white/7 px-5 py-4 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-blue-400/25 hover:shadow-[0_16px_50px_rgba(59,130,246,0.16)]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/16 text-lg">
                G
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Groups</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.totalGroups}</p>
              </div>
            </div>
          </div>

          <div className="group rounded-full border border-white/10 bg-white/7 px-5 py-4 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-violet-400/25 hover:shadow-[0_16px_50px_rgba(139,92,246,0.16)]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/16 text-lg">
                R
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Expenses</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {currency.format(stats.totalExpenses)}
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-full border border-white/10 bg-white/7 px-5 py-4 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-sky-400/25 hover:shadow-[0_16px_50px_rgba(96,165,250,0.16)]">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/16 text-lg">
                S
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reputation Score</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.reputationScore}/100</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {groups.length === 0 ? (
          <div className="mt-8 rounded-[32px] border border-white/10 bg-white/6 px-6 py-12 text-center shadow-[0_20px_70px_rgba(2,6,23,0.25)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white">No groups yet</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
              Create your first group to start tracking expenses with a cleaner collaborative flow.
            </p>
            <button
              type="button"
              onClick={() => router.push("/groups/create")}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5"
            >
              Create Group
            </button>
          </div>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2">
            {groups.map((group) => {
              const statusLabel = getGroupStatus(group);
              const isActive = statusLabel === "Active";
              const members = group.members || [];
              const hiddenCount = Math.max(0, members.length - 3);

              return (
                <button
                  key={group._id}
                  type="button"
                  onClick={() => router.push(`/groups/${group._id}`)}
                  className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-6 text-left shadow-[0_18px_65px_rgba(2,6,23,0.26)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-white/16 hover:shadow-[0_22px_80px_rgba(59,130,246,0.18)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.12),_transparent_22%)] opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isActive ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                          <h2 className="text-2xl font-semibold tracking-tight text-white">
                            {group.name}
                          </h2>
                        </div>
                        <p className="mt-3 text-sm text-slate-400">
                          Created {formatCreatedDate(group.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                        <p className="mt-2 text-sm font-medium text-white">{statusLabel}</p>
                      </div>
                    </div>

                    <div className="mt-8 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Members</p>
                        <div className="mt-3 flex items-center">
                          {members.slice(0, 3).map((member, index) => (
                            <div
                              key={member._id}
                              className="-ml-2 first:ml-0"
                              style={{ zIndex: 10 - index }}
                            >
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name}
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-900/60"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white ring-2 ring-slate-900/60">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-slate-200 ring-2 ring-slate-900/60">
                              +{hiddenCount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expense</p>
                        <p
                          className={`mt-3 text-2xl font-semibold ${
                            isActive ? "text-amber-300" : "text-emerald-300"
                          }`}
                        >
                          {currency.format(group.totalExpense || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/8 bg-slate-950/28 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last Activity</p>
                      <p className="mt-2 text-sm text-slate-200">{getLastActivity(group)}</p>
                    </div>

                    <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-full animate-pulse bg-gradient-to-r from-blue-400/40 via-violet-400/80 to-blue-400/40" />
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-slate-400">
                        {group.expenseCount || 0} expenses tracked
                      </p>
                      <span className="translate-y-1 text-sm font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        Open Group {"->"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
