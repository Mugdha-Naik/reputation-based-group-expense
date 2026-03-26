"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import ReputationBadge from "@/components/ReputationBadge";

interface ProfileData {
  name: string;
  email: string;
  upiId?: string;
  image?: string;
  reputationScore?: number;
  createdAt?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [form, setForm] = useState<ProfileData>({
    name: "",
    email: "",
    upiId: "",
    image: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/profile", { credentials: "include" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to fetch profile");
        }

        setForm({
          name: data.user.name || "",
          email: data.user.email || "",
          upiId: data.user.upiId || "",
          image: data.user.image || "",
          reputationScore: data.user.reputationScore,
          createdAt: data.user.createdAt,
        });
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch profile";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, status]);

  function updateField(field: keyof ProfileData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          upiId: form.upiId,
          image: form.image,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update profile");
      }

      setForm((current) => ({
        ...current,
        name: data.user.name || "",
        email: data.user.email || "",
        upiId: data.user.upiId || "",
        image: data.user.image || "",
        reputationScore: data.user.reputationScore,
        createdAt: data.user.createdAt,
      }));

      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image,
          upiId: data.user.upiId,
        },
      });

      setSuccess("Profile updated successfully.");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Failed to update profile";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <PageContainer className="flex items-center justify-center">
        <p className="text-sm text-gray-300">Loading profile...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Your Profile</h1>
            <p className="mt-1 text-sm text-gray-400">
              Update your account details and payment identity.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-white hover:border-white"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:border-red-400"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-black">
                {(form.name || session?.user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{form.name || "User"}</p>
                <p className="text-sm text-gray-400">{form.email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-gray-300">
              <ReputationBadge initialScore={form.reputationScore ?? session?.user?.reputationScore ?? 100} />

              <div className="rounded-xl border border-gray-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">UPI ID</p>
                <p className="mt-2 break-all text-sm text-gray-200">
                  {form.upiId || "Not added yet"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Member Since</p>
                <p className="mt-2 text-sm text-gray-200">
                  {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Recently"}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
          >
            <div className="space-y-5">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-white">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-white">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label htmlFor="profile-upi" className="block text-sm font-medium text-white">
                  UPI ID
                </label>
                <input
                  id="profile-upi"
                  type="text"
                  placeholder="example@upi"
                  value={form.upiId || ""}
                  onChange={(event) => updateField("upiId", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white"
                />
              </div>

              <div>
                <label htmlFor="profile-image" className="block text-sm font-medium text-white">
                  Profile Image URL
                </label>
                <input
                  id="profile-image"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={form.image || ""}
                  onChange={(event) => updateField("image", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
