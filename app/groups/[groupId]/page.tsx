"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const groupIdValue = Array.isArray(groupId) ? groupId[0] : groupId;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!groupIdValue) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/groups/${groupIdValue}/members`, {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch members");

        const data = await res.json();
        setMembers(data.members || []);
        setGroupName(data.groupName || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupIdValue]);

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto mt-8 p-4 pb-24 bg-gray-900 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {groupName || "Group Members"}
          </h1>
          <button
            className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 text-sm"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </div>
        {loading ? <p>Loading members...</p> : <MemberList members={members} />}
      </div>
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-semibold shadow-lg hover:bg-blue-500"
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
