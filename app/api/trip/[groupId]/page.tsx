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

  useEffect(() => {
    if (groupId) {
      fetchSettlements();
    }
  }, [groupId]);

  if (loading) return <p>Loading settlements...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Settlement History</h2>

      <SettlementList settlements={settlements} onMarkPaid={markPaid} />
    </div>
  );
}