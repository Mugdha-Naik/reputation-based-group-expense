"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";
import ProfileMenu from "@/components/ProfileMenu";
import UserReputationCard from "@/components/UserReputationCard";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  image?: string;
  reputationScore?: number;
  createdAt?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { status } = useSession();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/users", { credentials: "include" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch users");
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch users";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router, status]);

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-300">Loading users...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-blue-300">Community View</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              User Reputation Board
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              See every registered user ranked by reputation score.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white hover:border-white"
            >
              Dashboard
            </button>
            <ProfileMenu />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-4 text-sm text-gray-400">
            No users found yet.
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <UserReputationCard
                key={user._id}
                name={user.name}
                email={user.email}
                image={user.image}
                reputationScore={user.reputationScore ?? 100}
                createdAt={user.createdAt}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
