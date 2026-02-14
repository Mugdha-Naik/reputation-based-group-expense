"use client";

import { useState } from "react";

export default function GroupsPage() {
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");

  const createGroup = async () => {
    setMessage("");

    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: groupName }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Failed to create group");
    } else {
      setMessage("Group created successfully!");
      setGroupName("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-xl font-bold mb-4">
          Create Group
        </h1>

        {message && (
          <p className="mb-3 text-sm text-blue-600">
            {message}
          </p>
        )}

        <input
          type="text"
          placeholder="Group name"
          className="w-full p-2 border rounded mb-4"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <button
          onClick={createGroup}
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Create Group
        </button>
      </div>
    </div>
  );
}
