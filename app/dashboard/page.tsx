"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";
import { useEffect as useThemeEffect, useState as useThemeState } from "react";
import GroupQRCode from "@/components/GroupQRCode";

interface GroupMember {
  _id: string;
  name: string;
  image?: string;
}

interface LatestExpense {
  title: string;
  amount: number;
  paidBy: string;
  paidByName?: string;
  createdAt?: string;
}

interface Group {
  _id: string;
  name: string;
  createdAt?: string;
  members?: GroupMember[];
  totalExpense?: number;
  expenseCount?: number;
  latestExpense?: LatestExpense | null;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getGreetingName = (fullName?: string | null) => {
  if (!fullName?.trim()) return "Nancy";
  return fullName.trim().split(/\s+/)[0];
};

const getGroupStatus = (group: Group) =>
  (group.totalExpense || 0) > 0 ? "Active" : "Settled";

const getRelativeTime = (date?: string) => {
  if (!date) return "just now";

  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const getLastActivity = (group: Group) => {
  if (!group.latestExpense) return "No recent activity yet";

  const paidByName =
    group.latestExpense.paidByName ||
    group.members?.find((member) => member._id === group.latestExpense?.paidBy)?.name ||
    group.latestExpense.title;

  return `${paidByName} added ${currency.format(
    group.latestExpense.amount
  )} - ${getRelativeTime(group.latestExpense.createdAt)}`;
};

function ReputationRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, score));

  return (
    <div
      className="relative flex h-16 w-16 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#60a5fa ${safeScore * 3.6}deg, #8b5cf6 ${safeScore * 3.6}deg, rgba(148,163,184,0.18) 0deg)`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f172a] text-sm font-semibold text-white">
        {safeScore}
      </div>
    </div>
  );
}


export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [reputationScore, setReputationScore] = useState<number>(session?.user?.reputationScore ?? 97);
  const [reputationLoading, setReputationLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrGroup, setQrGroup] = useState<Group | null>(null);

  

  // Fetch groups (summary only) as soon as authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;
    let ignore = false;
    const fetchGroups = async () => {
      try {
        setGroupsLoading(true);
        setError("");
        // Only fetch summary data for dashboard
        const res = await fetch("/api/groups/my?groupLimit=10&expenseLimit=1", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch groups");
        if (!ignore) setGroups(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (!ignore) setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch groups");
      } finally {
        if (!ignore) setGroupsLoading(false);
      }
    };
    fetchGroups();
    return () => { ignore = true; };
  }, [router, status]);

  // Fetch reputation in parallel
  useEffect(() => {
    if (status !== "authenticated") return;
    let ignore = false;
    const fetchReputation = async () => {
      try {
        setReputationLoading(true);
        const res = await fetch("/api/reputation", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!ignore && typeof data?.score === "number") setReputationScore(data.score);
        }
      } finally {
        if (!ignore) setReputationLoading(false);
      }
    };
    fetchReputation();
    return () => { ignore = true; };
  }, [status]);

  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalExpenses = groups.reduce((sum, group) => sum + (group.totalExpense || 0), 0);
    return {
      totalGroups,
      totalExpenses,
      reputationScore,
    };
  }, [groups, reputationScore]);

  // Detect light/dark mode (if you have a theme context, otherwise fallback to localStorage or default)
  const [isDayMode, setIsDayMode] = useThemeState(false);
  useThemeEffect(() => {
    const storedTheme = typeof window !== "undefined" ? window.localStorage.getItem("home-theme") : null;
    setIsDayMode(storedTheme === "day" || !storedTheme);
  }, []);

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.12),_transparent_22%),linear-gradient(180deg,#07111f_0%,#0f172a_48%,#111827_100%)] text-white">
      <div className="mx-auto max-w-[920px]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/6 px-6 py-6 shadow-[0_24px_90px_rgba(2,6,23,0.36)] backdrop-blur-xl sm:px-8 sm:py-8">
          <div className={isDayMode
            ? "absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.10),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.08),_transparent_22%)]"
            : "absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.15),_transparent_22%)]"} />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={isDayMode ? "text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl" : "text-3xl font-semibold tracking-tight text-white sm:text-4xl"}>
                Your Groups
              </h1>
              <p className={isDayMode ? "mt-2 text-sm text-[var(--color-text-secondary)]" : "mt-2 text-sm text-slate-300"}>
                Welcome back, {getGreetingName(session?.user?.name)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[28px] border border-white/12 bg-slate-950/35 px-4 py-3 shadow-[0_12px_36px_rgba(15,23,42,0.28)]">
                {reputationLoading ? (
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className={isDayMode ? "h-16 w-16 rounded-full bg-[var(--color-bg)]" : "h-16 w-16 rounded-full bg-slate-800"} />
                    <div>
                      <div className={isDayMode ? "h-3 w-16 rounded bg-[var(--color-bg)] mb-2" : "h-3 w-16 rounded bg-slate-800 mb-2"} />
                      <div className={isDayMode ? "h-3 w-10 rounded bg-[var(--color-bg)]" : "h-3 w-10 rounded bg-slate-800"} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <ReputationRing score={stats.reputationScore} />
                    <div>
                      <p className={isDayMode ? "text-xs uppercase tracking-[0.18em] text-[var(--color-accent-blue)]" : "text-xs uppercase tracking-[0.18em] text-slate-400"}>
                        Reputation
                      </p>
                      <p className={isDayMode ? "mt-1 text-sm font-medium text-[var(--color-text)]" : "mt-1 text-sm font-medium text-white"}>
                        {stats.reputationScore}/100
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push("/users")}
                className="rounded-full border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/12"
              >
                Users
              </button>

              <button
                type="button"
                onClick={() => router.push("/groups/create")}
                className={
                   
                  "rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(99,102,241,0.34)]"}
              >
                + Create Group
              </button>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className={

          "flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/8 text-sm font-semibold text-white transition hover:bg-white/12"}
              >
                {(session?.user?.name || "N").charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </section>

        {groupsLoading && (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/6 px-5 py-4 text-sm text-slate-300 backdrop-blur-xl">
            Loading your groups...
          </div>
        )}

        {!groupsLoading && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="group rounded-full border border-white/10 bg-white/7 px-5 py-4 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-blue-400/25 hover:shadow-[0_16px_50px_rgba(59,130,246,0.16)]">
  <div className="flex items-center gap-4">

    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/16 text-lg">
      G
    </div>

    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
        Total Groups
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">
        {stats.totalGroups}
      </p>
    </div>

  </div>
</div>

            <div className="group rounded-full border border-white/10 bg-white/7 px-5 py-4 shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-violet-400/25 hover:shadow-[0_16px_50px_rgba(139,92,246,0.16)]">
  <div className="flex items-center gap-4">
    
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/16 text-lg">
      R
    </div>

    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
        Total Expenses
      </p>
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
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
        Reputation Score
      </p>
      <p className="mt-1 text-2xl font-semibold text-white">
        {stats.reputationScore}/100
      </p>
    </div>

  </div>
</div>
          </section>
        )}

        {error && !groupsLoading ? (
          <div className="mt-6 rounded-[24px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!groupsLoading && !error && groups.length === 0 ? (
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
        ) : null}

        {!groupsLoading && !error && groups.length > 0 ? (
          <section className="mt-7 grid gap-4 md:grid-cols-2">
            {groups.map((group) => {
              const statusLabel = getGroupStatus(group);
              const isActive = statusLabel === "Active";
              const members = group.members || [];
              const hiddenCount = Math.max(0, members.length - 3);

              return (
                <div
                  key={group._id}
                  className={isDayMode
                    ? "group relative overflow-hidden rounded-[22px] border border-[#D1D5DB] bg-gradient-to-br from-[var(--color-accent-blue)]/10 via-white/80 to-violet-200/30 p-3.5 text-left shadow-[0_8px_32px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[var(--color-accent-blue)]"
                    : "group relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-3.5 text-left shadow-[0_18px_65px_rgba(2,6,23,0.26)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:shadow-[0_22px_80px_rgba(59,130,246,0.18)]"}
                >
                  <div className={isDayMode
                    ? "absolute inset-0 bg-gradient-to-br from-[var(--color-accent-blue)]/10 via-white/80 to-violet-200/30 opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                    : "absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.12),_transparent_22%)] opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"}
                  />
                  <div
                    className="relative cursor-pointer"
                    onClick={() => router.push(`/groups/${group._id}`)}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                          <h2 className="text-[1.35rem] font-semibold tracking-tight text-white">
                            {group.name}
                          </h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          Created on{" "}
                          {group.createdAt
                            ? new Date(group.createdAt).toLocaleDateString()
                            : "recently"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                        <p className="mt-1 text-[13px] font-medium text-white">{statusLabel}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Members</p>
                        <div className="mt-1.5 flex items-center">
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
                                  className="h-7 w-7 rounded-full object-cover ring-2 ring-slate-900/60"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white ring-2 ring-slate-900/60">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                          {hiddenCount > 0 && (
                            <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-slate-200 ring-2 ring-slate-900/60">
                              +{hiddenCount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expense</p>
                        <p
                          className={`mt-1.5 text-[1.45rem] font-semibold ${
                            isActive ? "text-amber-300" : "text-emerald-300"
                          }`}
                        >
                          {currency.format(group.totalExpense || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-[16px] border border-white/8 bg-slate-950/28 px-3 py-1.5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last Activity</p>
                      <p className="mt-1 text-[13px] text-slate-200">{getLastActivity(group)}</p>
                    </div>

                    <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-full animate-pulse bg-gradient-to-r from-blue-400/40 via-violet-400/80 to-blue-400/40" />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[13px] text-slate-400">
                        {group.expenseCount || 0} expenses tracked
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="translate-y-1 text-[13px] font-medium text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          Open Group {"->"}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setQrGroup(group);
                          }}
                          className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur-md transition hover:border-blue-300/40 hover:bg-blue-500/20 hover:text-white"
                        >
                          QR Code
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}
      </div>

      {qrGroup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
          onClick={() => setQrGroup(null)}
        >
          <div
            className="relative w-full max-w-md rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92))] p-6 shadow-[0_28px_100px_rgba(2,6,23,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrGroup(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-slate-200 transition hover:bg-white/10 hover:text-white"
              aria-label="Close QR popup"
            >
              x
            </button>

            <div className="pr-12">
              <p className="text-xs uppercase tracking-[0.22em] text-sky-300">Join Group</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{qrGroup.name}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Scan this QR code to open the join link for this group.
              </p>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-900/70 p-5">
              <GroupQRCode groupId={qrGroup._id} size={220} />
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => router.push(`/join/${qrGroup._id}`)}
                className="rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition hover:-translate-y-0.5"
              >
                Open Join Page
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}
