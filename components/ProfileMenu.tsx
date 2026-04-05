"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import ReputationBadge from "@/components/ReputationBadge";

interface ProfileMenuProps {
  className?: string;
}

interface ProfileSummary {
  name?: string;
  email?: string;
  upiId?: string;
  reputationScore?: number;
  createdAt?: string;
}

interface PendingSummaryItem {
  amount: number;
  createdAt?: string;
  toUserName: string;
}

interface PendingSummary {
  count: number;
  totalAmount: number;
  items: PendingSummaryItem[];
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
      <span>{label}</span>
    </div>
  );
}

export default function ProfileMenu({ className = "" }: ProfileMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [pendingSummary, setPendingSummary] = useState<PendingSummary | null>(null);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isLoggedIn = Boolean(session?.user);
  const displayName = profile?.name || session?.user?.name || "Profile";
  const displayEmail = profile?.email || session?.user?.email || "";
  const displayReputation = profile?.reputationScore ?? session?.user?.reputationScore ?? 100;
  const displayUpiId = profile?.upiId || session?.user?.upiId || "Not added";
  const displayInitial = displayName.charAt(0).toUpperCase() || "P";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isLoggedIn || profile) {
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileRes, groupsRes] = await Promise.all([
          fetch("/api/profile", { credentials: "include" }),
          fetch("/api/groups/my", { credentials: "include" }),
        ]);

        const profileData = await profileRes.json();
        if (!profileRes.ok) {
          throw new Error(profileData?.message || "Failed to load profile");
        }

        setProfile(profileData.user);
        setPendingSummary(profileData.pendingSummary ?? null);

        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setGroupCount(Array.isArray(groupsData) ? groupsData.length : 0);
        } else {
          setGroupCount(null);
        }
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to load profile";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isLoggedIn, open, profile]);

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        aria-label="Profile"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 text-sm text-gray-200 transition hover:border-white hover:text-white"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-semibold text-black">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            displayInitial
          )}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-12 z-50 w-[320px] origin-top-right animate-[profilePop_760ms_cubic-bezier(0.16,1,0.3,1)] rounded-2xl border border-gray-800 bg-gray-950 p-4 shadow-2xl shadow-black/50">
            {!isLoggedIn ? (
              <div>
                <div className="rounded-xl border border-gray-800 bg-black p-4">
                  <p className="text-sm font-semibold text-white">Welcome</p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    Sign in to manage your groups, track balances, and settle expenses.
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-gray-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="rounded-xl border border-gray-800 bg-black p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-base font-semibold text-black">
                      {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        displayInitial
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                      <p className="truncate text-xs text-gray-400">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ReputationBadge initialScore={displayReputation} />
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Groups
                      </p>
                      {loading && groupCount === null ? (
                        <div className="mt-3">
                          <LoadingSpinner label="Loading..." />
                        </div>
                      ) : (
                        <p className="mt-2 text-lg font-semibold text-white">
                          {groupCount ?? "--"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">UPI ID</p>
                    <p className="mt-2 break-all text-sm text-gray-200">{displayUpiId}</p>
                  </div>

                  <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Pending To Pay
                      </p>
                      {!loading ? (
                        <span className="text-xs text-yellow-300">
                          INR {pendingSummary?.totalAmount?.toFixed(2) ?? "0.00"}
                        </span>
                      ) : null}
                    </div>
                    {loading && !pendingSummary ? (
                      <div className="mt-3 min-h-16 rounded-lg border border-dashed border-gray-800 bg-black/30 px-3 py-4">
                        <LoadingSpinner label="Fetching payment details..." />
                      </div>
                    ) : pendingSummary && pendingSummary.count > 0 ? (
                      <div className="mt-2 space-y-2">
                        {pendingSummary.items.slice(0, 3).map((item, index) => (
                          <div key={`${item.toUserName}-${index}`} className="text-sm text-gray-200">
                            <p>
                              Pay {item.toUserName} INR{" "}
                              {Number.isInteger(item.amount) ? item.amount : item.amount.toFixed(2)}
                            </p>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500">
                          {pendingSummary.count} pending settlement
                          {pendingSummary.count === 1 ? "" : "s"}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-400">No pending payments.</p>
                    )}
                  </div>

                  {profile?.createdAt && (
                    <p className="mt-3 text-xs text-gray-500">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {loading && <p className="mt-3 text-xs text-gray-500">Loading profile...</p>}
                {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

                <div className="mt-4 grid gap-2">
                  <Link
                    href="/users"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white"
                  >
                    View All Users
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-gray-200"
                  >
                    View Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-white"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-400"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
          <style jsx>{`
            @keyframes profilePop {
              from {
                opacity: 0;
                transform: translateY(-18px) scale(0.92);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
