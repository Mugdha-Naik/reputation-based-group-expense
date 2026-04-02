"use client";

import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";

export default function SettlementPage() {
  const router = useRouter();

  return (
    <PageContainer>
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl font-semibold text-white">Settlements</h1>
        <p className="mt-2 text-sm text-gray-400">
          Open a specific group to view and manage settlements.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
        >
          Go to Dashboard
        </button>
      </div>
    </PageContainer>
  );
}
