'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import CenteredCard from "@/components/layout/CenteredCard";

export default function CreateGroupPage() {
  const [name, setName] = useState("")
  const router = useRouter()

  const handleCreate = async () => {
    const res = await fetch("/api/groups/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    if (res.ok) {
      router.push("/dashboard")
    } else {
      alert("Failed to create group")
    }
  }

  return (
    <CenteredCard cardClassName="rounded-lg">
        <h1 className="mb-4 text-xl font-bold">Create Group</h1>

        <input
          className="mb-4 w-full rounded-md border border-gray-600 bg-transparent p-2.5 outline-none focus:border-white"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="w-full rounded-md bg-white p-2.5 font-medium text-black hover:bg-gray-200"
        >
          Create
        </button>
    </CenteredCard>
  )
}
