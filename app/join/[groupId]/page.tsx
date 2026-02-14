"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { useSession } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

export default function JoinGroup() {
  const { groupId } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const groupIdValue = Array.isArray(groupId) ? groupId[0] : groupId;

  useEffect(() => {
    if (status === "loading") return;
    if (!groupIdValue) return;

    if (!session) {
      router.push(`/login?redirect=/join/${groupIdValue}`);
      return;
    }

    const joinGroup = async () => {
      await axios.post("/join", { groupId: groupIdValue });
      router.push("/dashboard");
    };

    joinGroup();
  }, [groupIdValue, router, session, status]);

  return (
    <CenteredCard cardClassName="rounded-xl text-center">
        <p className="text-base font-medium sm:text-lg">Joining group...</p>
        <p className="mt-2 text-sm text-gray-400">
          Please wait while we verify your account.
        </p>
    </CenteredCard>
  );
}
