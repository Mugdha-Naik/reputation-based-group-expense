"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";
import ProfileMenu from "@/components/ProfileMenu";
import UserReputationCard from "@/components/UserReputationCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

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
      <PageContainer className="flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]">
        <p className="text-sm text-slate-300">Loading users...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <div className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/6 px-6 py-7 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.18),_transparent_24%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="cyan">Community View</Badge>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Reputation Leaderboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                See every registered user ranked by reputation score.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                Dashboard
              </Button>
              <ProfileMenu />
            </div>
          </div>
        </section>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : users.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm text-slate-300 backdrop-blur-xl">
            No users found yet.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
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
