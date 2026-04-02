"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import PageContainer from "@/components/layout/PageContainer";
import ProfileMenu from "@/components/ProfileMenu";
import ReputationBadge from "@/components/ReputationBadge";

interface Group {
  _id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrGroup, setQrGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const fetchGroups = async () => {
      try {
        setError("");
        const res = await axios.get("/api/groups/my");
        setGroups(res.data);
      } catch (fetchError) {
        setError(
          axios.isAxiosError(fetchError)
            ? fetchError.response?.data?.message || "Failed to fetch groups"
            : "Failed to fetch groups"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [router, status]);

  const getJoinUrl = (groupId: string) => {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const runtimeBaseUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    const baseUrl = configuredBaseUrl || runtimeBaseUrl;

    if (!baseUrl) return "";
    return `${baseUrl}/join/${groupId}`;
  };

  const openQrModal = (group: Group) => {
    setQrGroup(group);
    setCopied(false);
  };

  const closeQrModal = () => {
    setQrGroup(null);
    setCopied(false);
  };

  const joinUrl = qrGroup ? getJoinUrl(qrGroup._id) : "";
  const copyJoinLink = async () => {
    if (!joinUrl) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(joinUrl);
      } else if (typeof document !== "undefined") {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = joinUrl;
        tempTextArea.setAttribute("readonly", "");
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-9999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
      } else {
        throw new Error("Clipboard API unavailable");
      }
      setCopied(true);
    } catch (copyError) {
      console.error("Failed to copy join link", copyError);
    }
  };

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-300">Loading your dashboard...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Your Groups</h1>
          {session?.user?.name && (
            <p className="mt-1 text-sm text-gray-400">Welcome back, {session.user.name}.</p>
          )}
          <div className="mt-3">
            <ReputationBadge initialScore={session?.user?.reputationScore ?? 100} compact />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/users")}
            className="rounded-lg border border-gray-700 px-4 py-2 font-medium text-white hover:border-white"
          >
            Users
          </button>
          <button
            onClick={() => router.push("/groups/create")}
            className="rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200"
          >
            + Create Group
          </button>
          <ProfileMenu />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-3 rounded-lg border border-red-400/50 px-3 py-2 text-xs text-red-200 hover:border-red-300"
          >
            Try Again
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-gray-400">
          <p className="text-base font-medium text-white">No groups yet</p>
          <p className="mt-2">Create your first group to start managing shared expenses.</p>
          <button
            type="button"
            onClick={() => router.push("/groups/create")}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group._id}
              className="cursor-pointer rounded-xl border border-gray-700 bg-gray-900 p-3 hover:border-white sm:p-4"
              onClick={() => router.push(`/groups/${group._id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <button
                  className="rounded-md border border-gray-500 px-2 py-1 text-xs hover:border-white hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    openQrModal(group);
                  }}
                >
                  QR
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Created on {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {qrGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={closeQrModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Invite to {qrGroup.name}</h3>
            <p className="mt-1 text-sm text-gray-400">Scan to join this group</p>
            {joinUrl && (
              <div className="mx-auto mt-4 w-fit rounded-lg bg-white p-2">
                <QRCodeSVG value={joinUrl} size={220} />
              </div>
            )}
            <p className="mt-4 break-all text-xs text-gray-400">{joinUrl}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={copyJoinLink}
                className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-200"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={closeQrModal}
                className="flex-1 rounded-lg border border-gray-500 px-3 py-2 text-sm hover:border-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
