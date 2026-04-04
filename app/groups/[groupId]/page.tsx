"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ActivityList from "@/components/ActivityList";
import ExpenseSummary from "@/components/ExpenseSummary";
import Leaderboard from "@/components/Leaderboard";
import MemberCard from "@/components/MemberCard";
import PageContainer from "@/components/layout/PageContainer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getExperienceLevel } from "@/lib/experience";

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
  fromUser: SettlementUser;
  toUser: SettlementUser;
}

const formatCurrency = (amount: number) => `INR ${amount.toFixed(2)}`;

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

  const leaderboard = useMemo(() => {
    return [...members]
      .map((member) => ({
        id: member._id,
        name: member.name,
        xp: member.reputationScore ?? 100,
        level: getExperienceLevel(member.reputationScore ?? 100).label,
        avatar: member.image,
      }))
      .sort((left, right) => right.xp - left.xp);
  }, [members]);

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

  const totalExpense = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const pendingSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "pending"),
    [settlements]
  );

  const activityItems = useMemo(() => {
    const memberNames = new Map(members.map((member) => [member._id, member.name]));

    const expenseItems = expenses.map((expense) => ({
      id: `expense-${expense._id}`,
      title: `${memberNames.get(expense.paidBy) || "A member"} paid for ${expense.title}`,
      subtitle: expense.category?.trim() || "Shared expense",
      amount: formatCurrency(expense.amount),
      tone: "paid" as const,
      timestamp: new Date(expense.createdAt || 0).getTime(),
    }));

    const settlementItems = pendingSettlements.map((settlement) => ({
      id: `settlement-${settlement._id}`,
      title: `${settlement.fromUser.name} owes ${settlement.toUser.name}`,
      subtitle: "Pending settlement",
      amount: formatCurrency(settlement.amount),
      tone: "owes" as const,
      timestamp: new Date(settlement.createdAt || 0).getTime(),
    }));

    return [...expenseItems, ...settlementItems]
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        amount: item.amount,
        tone: item.tone,
      }));
  }, [expenses, members, pendingSettlements]);

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center bg-[#07111f]">
        <p className="text-sm text-slate-300">Loading group details...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <div className="mx-auto w-full max-w-7xl pb-28">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 px-6 py-7 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.18),_transparent_24%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="cyan">Group Overview</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {groupName || "Group Members"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Track trust, shared spending, and pending dues in one premium snapshot.
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
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Members</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{members.length}</p>
                  <p className="mt-2 text-sm text-slate-400">Active people in this group</p>
                </Card>
                <Card className="p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Expense</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalExpense)}</p>
                  <p className="mt-2 text-sm text-slate-400">Across all recorded expenses</p>
                </Card>
                <Card className="p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending Dues</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{pendingSettlements.length}</p>
                  <p className="mt-2 text-sm text-slate-400">Outstanding settlements to close</p>
                </Card>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Members</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Reputation-first view with XP and level status.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {leaderboard.map((member, index) => (
                    <MemberCard
                      key={member.id}
                      name={member.name}
                      xp={member.xp}
                      level={member.level}
                      avatar={member.avatar}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </div>

              <ExpenseSummary
                totalExpense={totalExpense}
                categories={
                  categorySummary.length > 0
                    ? categorySummary
                    : [{ name: "No expenses yet", amount: 0 }]
                }
              />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-white">Leaderboard</h2>
                <Leaderboard entries={leaderboard} />
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-semibold text-white">Recent Activity</h2>
                {activityItems.length > 0 ? (
                  <ActivityList items={activityItems} />
                ) : (
                  <Card className="p-5 text-sm text-slate-300">
                    Activity will appear here when members add expenses or have pending dues.
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-5 left-0 right-0 px-4">
        <div className="mx-auto max-w-md">
          <Button
            className="w-full py-3.5 text-base"
            onClick={() =>
              router.push(`/trip/${encodeURIComponent(String(groupIdValue ?? ""))}?openExpense=1`)
            }
            disabled={!groupIdValue}
          >
            Add New Expense
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
