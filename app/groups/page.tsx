"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

export default function GroupsPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return <CenteredCard cardClassName="rounded-xl text-center">Loading...</CenteredCard>;
  }

  return (
    <CenteredCard cardClassName="rounded-xl text-center">
      <h1 className="text-2xl font-semibold">Groups</h1>
      <p className="mt-3 text-sm text-gray-400">
        Group management starts from the dashboard. Create a new group or open one of your
        existing groups to continue.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/groups/create")}
          className="flex-1 rounded-lg bg-white px-4 py-2.5 font-medium text-black hover:bg-gray-200"
        >
          Create Group
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 font-medium text-white hover:border-white"
        >
          Go to Dashboard
        </button>
      </div>
    </CenteredCard>
  );
}
