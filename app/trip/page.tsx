"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";

export default function TripLandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-300">Loading trip page...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h1 className="text-xl font-semibold text-white">Trip</h1>
        <p className="mt-2 text-sm text-gray-400">
          Open a specific group from your dashboard to manage expenses and settlements for that
          trip.
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
