"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getExperienceLevel } from "@/lib/experience";
import { getReputationLabel, getReputationTone } from "@/lib/reputation";

interface Member {
  _id: string;
  name: string;
  email: string;
  image?: string;
  reputationScore?: number;
}

interface Expense {
  _id: string;
  title: string;
  category?: string;
  amount: number;
  paidBy: string;
  createdAt?: string;
}

interface SettlementUser {
  _id: string;
  name: string;
}

interface Settlement {
  _id: string;
  amount: number;
  status: "pending" | "completed";
  createdAt?: string;
  completedAt?: string;
  fromUser: SettlementUser;
  toUser: SettlementUser;
}

interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  dateLabel: string;
  tone: "paid" | "pending" | "completed";
}

const formatCurrency = (amount: number) => `INR ${amount.toFixed(2)}`;

function formatDateLabel(date?: string) {
  if (!date) return "Recently";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCompactDate(date?: string) {
  if (!date) return "Recently";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const groupIdValue = Array.isArray(groupId) ? groupId[0] : groupId;

  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated" || !groupIdValue) {
      return;
    }

    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [membersRes, expensesRes, settlementsRes] = await Promise.all([
          fetch(`/api/groups/${groupIdValue}/members`, { credentials: "include" }),
          fetch(`/api/expenses?groupId=${groupIdValue}`, { credentials: "include" }),
          fetch(`/api/settlement/${groupIdValue}`, { credentials: "include" }),
        ]);

        const [membersData, expensesData, settlementsData] = await Promise.all([
          membersRes.json(),
          expensesRes.json(),
          settlementsRes.json(),
        ]);

        if (!membersRes.ok) {
          throw new Error(membersData?.message || "Failed to fetch members");
        }
        if (!expensesRes.ok) {
          throw new Error(expensesData?.message || "Failed to fetch expenses");
        }
        if (!settlementsRes.ok) {
          throw new Error(settlementsData?.message || "Failed to fetch settlements");
        }

        setMembers(Array.isArray(membersData.members) ? membersData.members : []);
        setExpenses(Array.isArray(expensesData.expenses) ? expensesData.expenses : []);
        setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
        setGroupName(membersData.groupName || "");
      } catch (fetchError) {
        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to fetch group details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupIdValue, router, status]);

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member._id, member.name])),
    [members]
  );

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const pendingSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "pending"),
    [settlements]
  );

  const completedSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "completed"),
    [settlements]
  );

  const totalPendingAmount = useMemo(
    () => pendingSettlements.reduce((sum, settlement) => sum + settlement.amount, 0),
    [pendingSettlements]
  );

  const balances = useMemo(() => {
    const base: Record<string, number> = {};
    members.forEach((member) => {
      base[member._id] = 0;
    });

    pendingSettlements.forEach((settlement) => {
      if (settlement.toUser?._id) {
        base[settlement.toUser._id] = (base[settlement.toUser._id] || 0) + settlement.amount;
      }
      if (settlement.fromUser?._id) {
        base[settlement.fromUser._id] = (base[settlement.fromUser._id] || 0) - settlement.amount;
      }
    });

    return members.map((member) => ({
      memberId: member._id,
      memberName: member.name,
      email: member.email,
      avatar: member.image,
      amount: base[member._id] || 0,
      reputationScore: member.reputationScore ?? 100,
    }));
  }, [members, pendingSettlements]);

  const categorySummary = useMemo(() => {
    const totals = expenses.reduce<Record<string, number>>((accumulator, expense) => {
      const key = expense.category?.trim() || "Other";
      accumulator[key] = (accumulator[key] || 0) + expense.amount;
      return accumulator;
    }, {});

    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((left, right) => right.amount - left.amount);
  }, [expenses]);

  const timelineItems = useMemo(() => {
    const expenseItems: TimelineItem[] = expenses.map((expense) => ({
      id: `expense-${expense._id}`,
      title: `${memberNameById.get(expense.paidBy) || "A member"} paid for ${expense.title}`,
      subtitle: expense.category?.trim() || "Shared expense added",
      amount: formatCurrency(expense.amount),
      dateLabel: formatCompactDate(expense.createdAt),
      tone: "paid",
    }));

    const settlementItems: TimelineItem[] = settlements.map((settlement) => {
      const completed = settlement.status === "completed";
      return {
        id: `settlement-${settlement._id}`,
        title: completed
          ? `${settlement.fromUser.name} paid back ${settlement.toUser.name}`
          : `${settlement.fromUser.name} owes ${settlement.toUser.name}`,
        subtitle: completed ? "Settlement completed" : "Settlement pending",
        amount: formatCurrency(settlement.amount),
        dateLabel: formatCompactDate(completed ? settlement.completedAt : settlement.createdAt),
        tone: completed ? "completed" : "pending",
      };
    });

    return [...settlementItems, ...expenseItems]
      .sort((left, right) => right.dateLabel.localeCompare(left.dateLabel))
      .slice(0, 8);
  }, [expenses, memberNameById, settlements]);

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center bg-[#07111f]">
        <p className="text-sm text-slate-300">Loading group details...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 px-6 py-7 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.18),_transparent_24%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="cyan">Group Overview</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {groupName || "Group Members"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                See what is settled, who still owes money, and what happened most recently.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => router.back()}>
                Back
              </Button>
              <Button
                onClick={() =>
                  router.push(`/trip/${encodeURIComponent(String(groupIdValue))}?openExpense=1`)
                }
              >
                Open Expense Flow
              </Button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : members.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/6 p-6 text-sm text-slate-300 backdrop-blur-xl">
            No members found in this group yet.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Members</p>
                <p className="mt-3 text-3xl font-semibold text-white">{members.length}</p>
                <p className="mt-2 text-sm text-slate-400">People currently in this group</p>
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Expense</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalExpense)}</p>
                <p className="mt-2 text-sm text-slate-400">All shared spending recorded so far</p>
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Outstanding</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalPendingAmount)}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {pendingSettlements.length === 0
                    ? "Everything is settled right now"
                    : `${pendingSettlements.length} payment${pendingSettlements.length === 1 ? "" : "s"} pending`}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Latest Status</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {pendingSettlements.length === 0 ? "Settled" : "Action"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {pendingSettlements.length === 0
                    ? `${completedSettlements.length} completed settlements in history`
                    : "Open dues need attention"}
                </p>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Who Owes Whom</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      This is the clearest picture of what still needs to be settled.
                    </p>
                  </div>
                  <Badge variant={pendingSettlements.length === 0 ? "emerald" : "amber"}>
                    {pendingSettlements.length === 0 ? "All Settled" : `${pendingSettlements.length} Open`}
                  </Badge>
                </div>

                {pendingSettlements.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-5">
                    <p className="text-lg font-semibold text-emerald-200">No one owes anything right now.</p>
                    <p className="mt-2 text-sm text-emerald-100/80">
                      The group is fully settled. New expenses will appear here when they create dues.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {pendingSettlements.map((settlement) => (
                      <div
                        key={settlement._id}
                        className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {settlement.fromUser.name} owes {settlement.toUser.name}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                              Pending since {formatDateLabel(settlement.createdAt)}
                            </p>
                          </div>
                          <div className="sm:text-right">
                            <p className="text-2xl font-semibold text-amber-300">
                              {formatCurrency(settlement.amount)}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">Outstanding settlement</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Members</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Balances first, reputation second. Each card shows the member’s current standing.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {balances.map((entry) => {
                    const reputationLabel = getReputationLabel(entry.reputationScore);
                    const reputationTone = getReputationTone(entry.reputationScore);
                    const level = getExperienceLevel(entry.reputationScore).label;
                    const balanceTone =
                      entry.amount > 0
                        ? "text-emerald-300"
                        : entry.amount < 0
                          ? "text-amber-300"
                          : "text-slate-200";
                    const balanceLabel =
                      entry.amount > 0
                        ? "Should receive"
                        : entry.amount < 0
                          ? "Needs to pay"
                          : "All settled";

                    return (
                      <div
                        key={entry.memberId}
                        className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            {entry.avatar ? (
                              <img
                                src={entry.avatar}
                                alt={entry.memberName}
                                className="h-14 w-14 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-xl font-semibold text-white">
                                {entry.memberName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xl font-semibold text-white">{entry.memberName}</p>
                              <p className="truncate text-sm text-slate-400">{entry.email}</p>
                            </div>
                          </div>
                          <div className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${reputationTone}`}>
                            {reputationLabel}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Balance</p>
                            <p className={`mt-2 text-lg font-semibold ${balanceTone}`}>
                              {entry.amount === 0
                                ? formatCurrency(0)
                                : `${entry.amount > 0 ? "+" : "-"}${formatCurrency(Math.abs(entry.amount)).replace("INR ", "INR ")}`}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">{balanceLabel}</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-slate-950/45 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Reputation</p>
                            <p className="mt-2 text-lg font-semibold text-white">{entry.reputationScore} XP</p>
                            <p className="mt-1 text-xs text-slate-400">Level {level}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Expense Breakdown</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Where the group’s money has gone so far.
                    </p>
                  </div>
                  <p className="text-sm text-slate-400">
                    {categorySummary.length} categor{categorySummary.length === 1 ? "y" : "ies"}
                  </p>
                </div>

                {categorySummary.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/45 p-5 text-sm text-slate-300">
                    No expenses yet. Once someone adds spending, the category mix will show here.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {categorySummary.map((category) => {
                      const percentage = totalExpense > 0 ? (category.amount / totalExpense) * 100 : 0;
                      return (
                        <div key={category.name} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-white">{category.name}</p>
                              <p className="mt-1 text-sm text-slate-400">
                                {percentage.toFixed(0)}% of total group spend
                              </p>
                            </div>
                            <p className="text-xl font-semibold text-cyan-200">
                              {formatCurrency(category.amount)}
                            </p>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                              style={{ width: `${Math.max(8, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Recent Timeline</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Expenses and settlements, shown in the order they matter to the group.
                    </p>
                  </div>
                </div>

                {timelineItems.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/45 p-5 text-sm text-slate-300">
                    Timeline items will appear here when someone adds an expense or completes a settlement.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {timelineItems.map((item) => {
                      const pillClasses =
                        item.tone === "completed"
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                          : item.tone === "pending"
                            ? "border-amber-400/25 bg-amber-500/10 text-amber-200"
                            : "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";

                      return (
                        <div
                          key={item.id}
                          className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-white">{item.title}</p>
                              <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                            </div>
                            <div className={`rounded-full border px-3 py-1 text-xs font-medium ${pillClasses}`}>
                              {item.tone === "completed"
                                ? "Completed"
                                : item.tone === "pending"
                                  ? "Pending"
                                  : "Paid"}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-xl font-semibold text-white">{item.amount}</p>
                            <p className="text-sm text-slate-400">{item.dateLabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-white">Next Best Action</h2>
                {pendingSettlements.length > 0 ? (
                  <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5">
                    <p className="text-lg font-semibold text-amber-100">There are pending settlements to close.</p>
                    <p className="mt-2 text-sm text-amber-50/80">
                      Open the expense flow to complete repayments and bring the group back to settled.
                    </p>
                    <div className="mt-4">
                      <Button
                        onClick={() =>
                          router.push(`/trip/${encodeURIComponent(String(groupIdValue))}?openExpense=1`)
                        }
                      >
                        Open Expense Flow
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 rounded-[24px] border border-cyan-400/20 bg-cyan-500/10 p-5">
                    <p className="text-lg font-semibold text-cyan-100">This group is fully settled.</p>
                    <p className="mt-2 text-sm text-cyan-50/80">
                      Add a new expense when the group spends again. The next split will appear automatically.
                    </p>
                    <div className="mt-4">
                      <Button
                        onClick={() =>
                          router.push(`/trip/${encodeURIComponent(String(groupIdValue))}?openExpense=1`)
                        }
                      >
                        Add New Expense
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
