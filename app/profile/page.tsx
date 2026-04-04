"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BadgeList from "@/components/BadgeList";
import PageContainer from "@/components/layout/PageContainer";
import XPProgressBar from "@/components/XPProgressBar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getExperienceLevel, getProfileBadges } from "@/lib/experience";

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

  const reputationScore = form.reputationScore ?? session?.user?.reputationScore ?? 100;
  const level = useMemo(() => getExperienceLevel(reputationScore), [reputationScore]);
  const badges = useMemo(() => getProfileBadges(reputationScore), [reputationScore]);

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
      <PageContainer className="flex items-center justify-center bg-[#07111f]">
        <p className="text-sm text-slate-300">Loading profile...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(145deg,#020617_0%,#0f172a_48%,#111827_100%)]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Profile</h1>
            <p className="mt-2 text-sm text-slate-300">
              Keep your account details current and show your trust level clearly.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
              Logout
            </Button>
          </div>
        </div>

        <Card className="mx-auto overflow-hidden p-0">
          <div className="bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_right,_rgba(139,92,246,0.16),_transparent_26%)] px-6 py-8 sm:px-8">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] bg-slate-950/70 p-1 shadow-[0_0_40px_rgba(59,130,246,0.18)] ring-1 ring-cyan-400/35">
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.name || "User"}
                    className="h-full w-full rounded-[28px] object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-400/25 to-violet-500/25 text-4xl font-semibold text-white">
                    {(form.name || session?.user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="mt-5 text-3xl font-semibold text-white">{form.name || "User"}</h2>
              <p className="mt-2 text-sm text-cyan-200">{level.label} User</p>

              <div className="mt-6 text-left">
                <XPProgressBar
                  currentXP={level.score}
                  maxXP={100}
                  level={level.label}
                />
                <p className="mt-3 text-center text-sm text-slate-300">
                  {level.pointsToNext > 0
                    ? `${level.pointsToNext} XP to unlock ${level.nextLevelLabel}`
                    : "You are already at the highest trust tier."}
                </p>
              </div>

              <div className="mt-6">
                <BadgeList badges={badges} />
              </div>

              <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current Level</p>
                  <p className="mt-2 text-lg font-semibold text-white">{level.label}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/55 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Member Since</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 px-6 py-6 sm:px-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-white">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:bg-slate-950"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:bg-slate-950"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:bg-slate-950"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:bg-slate-950"
                />
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {success && (
              <p className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            )}

            <div className="mt-6 flex justify-center">
              <Button type="submit" className="min-w-48 py-3" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
