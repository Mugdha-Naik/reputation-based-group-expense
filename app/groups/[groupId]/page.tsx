"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MemberList from "@/components/MemberList";
import PageContainer from "@/components/layout/PageContainer";

interface Member {
  _id: string;
  name: string;
  email: string;
}

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const { status } = useSession();
  const groupIdValue = Array.isArray(groupId) ? groupId[0] : groupId;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    if (!groupIdValue) return;

    const fetchMembers = async () => {
      try {
        setError("");
        const res = await fetch(`/api/groups/${groupIdValue}/members`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch members");
        }

        setMembers(data.members || []);
        setGroupName(data.groupName || "");
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupIdValue, router, status]);

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-300">Loading group details...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto mt-8 max-w-xl rounded-lg bg-gray-900 p-4 pb-24 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{groupName || "Group Members"}</h1>
          <button
            className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-black p-4 text-sm text-gray-400">
            No members found in this group yet.
          </div>
        ) : (
          <MemberList members={members} />
        )}
      </div>
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg hover:bg-blue-500"
            onClick={() =>
              router.push(`/trip/${encodeURIComponent(String(groupIdValue ?? ""))}`)
            }
            disabled={!groupIdValue}
          >
            Add Expense
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
