"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import AddExpenseModal from '@/components/AddExpenseModal';

function ExpensesRedirectContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  useEffect(() => {
    if (groupId) {
      router.replace(`/trip/${encodeURIComponent(groupId)}`);
    }
  }, [groupId, router]);

  return (
    <div className="dark-theme bg-gradient-to-br from-[#0F172A] via-blue-900 to-cyan-900 min-h-screen p-6">
      <h1 className="text-4xl font-bold text-white mb-6">Expenses</h1>

      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-400 text-white hover:opacity-90 transition-opacity"
      >
        Add Expense
      </button>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {!groupId ? (
        <PageContainer>
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-300">
              Add Expense has moved. Open a specific group to continue.
            </p>
          </div>
        </PageContainer>
      ) : null}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-blue-900 to-cyan-900" />}>
      <ExpensesRedirectContent />
    </Suspense>
  );
}
