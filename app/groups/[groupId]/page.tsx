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

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!groupId) return;

    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}/members`, {
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
  }, [groupId]);

  return (
    <PageContainer>
      <div className="max-w-xl mx-auto mt-8 p-4 bg-gray-900 rounded-lg shadow-lg">
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
    </PageContainer>
  );
}
