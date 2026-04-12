"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";
import { useState } from "react";

export default function JoinGroup() {
  const { groupId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const groupIdValue = Array.isArray(groupId) ? groupId[0] : groupId;
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!groupIdValue) return;

    if (!session) {
      router.push(`/login?redirect=/join/${groupIdValue}`);
      return;
    }

    const joinGroup = async () => {
      try {
        setError("");
        await axios.post("/join", { groupId: groupIdValue });
        router.push("/dashboard");
      } catch (joinError) {
        setError(
          axios.isAxiosError(joinError)
            ? joinError.response?.data?.message || joinError.message
            : "Failed to join group."
        );
      }
    };

    joinGroup();
  }, [groupIdValue, router, session, status]);

  return (
    <CenteredCard cardClassName="rounded-xl text-center">
        <p className="text-base font-medium sm:text-lg">Joining group...</p>
        <p className="mt-2 text-sm text-gray-400">
          Please wait while we verify your account.
        </p>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
    </CenteredCard>
  );
}
