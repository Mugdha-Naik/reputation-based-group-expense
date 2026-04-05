'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

export default function CreateGroupPage() {
  const { status } = useSession()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Add dark background to body for this page
  // (for Next.js app dir, safest is to set on the outer div)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  const handleCreate = async () => {
    if (loading) return

    if (!name.trim()) {
      setError("Please enter a group name.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to create group")
      }

      router.push("/dashboard")
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create group")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <CenteredCard cardClassName="rounded-lg text-center">Loading...</CenteredCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <CenteredCard cardClassName="rounded-lg">
        <h1 className="mb-4 text-xl font-bold text-white">Create Group</h1>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <input
          className="mb-4 w-full rounded-md border border-gray-700 bg-gray-900 text-white placeholder:text-gray-400 p-2.5 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-600/30"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-md bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 font-medium text-white hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </CenteredCard>
    </div>
  );
}
