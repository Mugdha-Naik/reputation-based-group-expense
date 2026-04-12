"use client";

import { getReputationLabel, getReputationTone } from "@/lib/reputation";

interface UserReputationCardProps {
  name: string;
  email: string;
  reputationScore: number;
  image?: string;
  createdAt?: string;
}

export default function UserReputationCard({
  name,
  email,
  reputationScore,
  image,
  createdAt,
}: UserReputationCardProps) {
  const tone = getReputationTone(reputationScore);
  const label = getReputationLabel(reputationScore);
  const initial = name.charAt(0).toUpperCase() || "U";

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 shadow-[0_24px_70px_rgba(2,6,23,0.35)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-semibold text-black">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{name}</p>
            <p className="truncate text-sm text-slate-300">{email}</p>
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-current" />
            {label}
          </span>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        <p>Member since</p>
        <p className="mt-1 text-sm text-slate-200">
          {createdAt ? new Date(createdAt).toLocaleDateString() : "Recently"}
        </p>
      </div>
    </div>
  );
}
