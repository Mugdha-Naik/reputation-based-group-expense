"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SettlementList from "@/components/SettlementList";

interface Settlement {
  _id: string;
  fromUser: { name: string };
  toUser: { name: string };
  amount: number;
  status: string;
}

export default function TripPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function fetchSettlements() {
    try {
      const res = await fetch(`/api/settlement/${groupId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch settlements");
        return;
      }

      const data = await res.json();
      setSettlements(data);
    } catch (err) {
      console.error("Error fetching settlements:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    try {
      const res = await fetch("/api/settlement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settlementId: id }),
      });

      if (!res.ok) {
        console.error("Failed to mark settlement paid");
        return;
      }

      fetchSettlements();
    } catch (err) {
      console.error("Error updating settlement:", err);
    }
  }

  async function generateSettlementsForGroup() {
    if (!groupId) return;

    try {
      setGenerating(true);
      const res = await fetch(`/api/settlement/generate/${groupId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to generate settlements");
        return;
      }

      await fetchSettlements();
    } catch (err) {
      console.error("Error generating settlements:", err);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    if (groupId) {
      fetchSettlements();
    }
  }, [groupId]);

  if (loading) return <p>Loading settlements...</p>;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Settlement History</h2>
        <button
          type="button"
          onClick={generateSettlementsForGroup}
          disabled={generating || !groupId}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? "Generating..." : "Generate Settlements"}
        </button>
      </div>

      <SettlementList settlements={settlements} onMarkPaid={markPaid} />
    </div>
  );
}
