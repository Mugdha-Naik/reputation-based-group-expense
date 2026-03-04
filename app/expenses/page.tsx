"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("groupId");

  useEffect(() => {
    if (groupId) {
      router.replace(`/trip/${encodeURIComponent(groupId)}`);
    }
  }, [groupId, router]);

  return (
    <PageContainer>
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-300">
          Add Expense has moved. Open a specific group to continue.
        </p>
      </div>
    </PageContainer>
  );
}
