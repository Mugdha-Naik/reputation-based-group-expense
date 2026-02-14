"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import PageContainer from "@/components/layout/PageContainer";

interface Group {
  _id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrGroup, setQrGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get("/api/groups/my");
        setGroups(res.data);
      } catch {
        console.error("Failed to fetch groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

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
    } catch (error) {
      console.error("Failed to copy join link", error);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Your Groups</h1>
        <button
          onClick={() => router.push("/groups/create")}
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-gray-200 sm:w-auto"
        >
          + Create Group
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-400">Loading groups...</p>
      ) : groups.length === 0 ? (
        <div className="text-gray-400">
          <p>No groups yet.</p>
          <p className="mt-2">Create a group to start managing expenses.</p>
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
                  className="px-2 py-1 text-xs border border-gray-500 rounded-md hover:border-white hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    openQrModal(group);
                  }}
                >
                  QR
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Created on {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {qrGroup && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center px-4 z-50"
          onClick={closeQrModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Invite to {qrGroup.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Scan to join this group
            </p>
            {joinUrl && (
              <div className="mx-auto mt-4 w-fit rounded-lg bg-white p-2">
                <QRCodeSVG value={joinUrl} size={220} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4 break-all">{joinUrl}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={copyJoinLink}
                className="flex-1 bg-white text-black px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <button
                onClick={closeQrModal}
                className="flex-1 border border-gray-500 px-3 py-2 rounded-lg text-sm hover:border-white"
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
