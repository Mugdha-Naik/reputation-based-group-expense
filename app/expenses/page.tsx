"use client";

import { FormEvent, useMemo, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { calculateSplit } from "@/lib/calculateSplit";

interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  createdAt?: string;
}

export default function ExpensesPage() {
  const [groupId, setGroupId] = useState("");
  const [memberIdsInput, setMemberIdsInput] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmongInput, setSplitAmongInput] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const parseCsv = (input: string) =>
    input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

  const memberIds = useMemo(() => parseCsv(memberIdsInput), [memberIdsInput]);

  const balances = useMemo(() => {
    if (memberIds.length === 0 || expenses.length === 0) return {};
    try {
      return calculateSplit(expenses, memberIds);
    } catch {
      return {};
    }
  }, [expenses, memberIds]);

  const fetchExpenses = async () => {
    if (!groupId.trim()) {
      setError("Group ID is required to fetch expenses");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const res = await fetch(
        `/api/expenses?groupId=${encodeURIComponent(groupId.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch expenses");
      }

      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch expenses";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: FormEvent) => {
    e.preventDefault();

    if (!groupId.trim()) {
      setError("Group ID is required");
      return;
    }

    const numericAmount = Number(amount);
    const splitAmong = parseCsv(splitAmongInput);

    if (!title.trim() || !paidBy.trim() || !numericAmount || splitAmong.length === 0) {
      setError("Fill title, amount, paidBy, and splitAmong");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: groupId.trim(),
          title: title.trim(),
          amount: numericAmount,
          paidBy: paidBy.trim(),
          splitAmong,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to add expense");
      }

      setSuccess("Expense added successfully");
      setTitle("");
      setAmount("");
      setPaidBy("");
      setSplitAmongInput("");
      await fetchExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add expense";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <p className="mt-1 text-sm text-gray-400">
          Add expenses, fetch group expenses, and view split balances.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-medium">Group Setup</h2>
            <div className="mt-3 space-y-3">
              <input
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Group ID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Member IDs (comma-separated): m1,m2,m3"
                value={memberIdsInput}
                onChange={(e) => setMemberIdsInput(e.target.value)}
              />
              <button
                onClick={fetchExpenses}
                disabled={loading}
                className="w-full rounded-md bg-white p-2.5 font-medium text-black hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Fetch Expenses"}
              </button>
            </div>
          </div>

          <form
            onSubmit={handleAddExpense}
            className="rounded-xl border border-gray-700 bg-gray-900 p-4"
          >
            <h2 className="text-lg font-medium">Add Expense</h2>
            <div className="mt-3 space-y-3">
              <input
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Title (e.g. Dinner)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Paid By (member id)"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              />
              <input
                className="w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
                placeholder="Split Among (comma-separated)"
                value={splitAmongInput}
                onChange={(e) => setSplitAmongInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-white p-2.5 font-medium text-black hover:bg-gray-200 disabled:opacity-50"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-500 bg-green-500/20 p-3 text-sm text-green-300">
            {success}
          </div>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-medium">Expenses List</h2>
            {expenses.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No expenses yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="rounded-lg border border-gray-700 p-3 text-sm"
                  >
                    <p className="font-medium">{expense.title}</p>
                    <p className="mt-1 text-gray-300">Amount: {expense.amount}</p>
                    <p className="text-gray-300">Paid By: {expense.paidBy}</p>
                    <p className="text-gray-300">
                      Split Among: {expense.splitAmong.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h2 className="text-lg font-medium">Calculated Split</h2>
            {Object.keys(balances).length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">
                Add member IDs and expenses to view balances.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {Object.entries(balances).map(([memberId, balance]) => (
                  <div
                    key={memberId}
                    className="flex items-center justify-between rounded-md border border-gray-700 px-3 py-2"
                  >
                    <span>{memberId}</span>
                    <span
                      className={
                        balance >= 0 ? "font-medium text-green-400" : "font-medium text-red-400"
                      }
                    >
                      {balance >= 0 ? "+" : ""}
                      {balance}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
