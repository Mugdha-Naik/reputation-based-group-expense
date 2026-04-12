"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface GroupQRCodeProps {
  groupId: string;
  size?: number;
}

const GroupQRCode: React.FC<GroupQRCodeProps> = ({ groupId, size = 180 }) => {
  if (!groupId) return null;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000");
  const joinUrl = `${appUrl}/join/${groupId}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-[28px] border border-white/12 bg-[rgba(17,24,39,0.92)] p-4 shadow-[0_18px_45px_rgba(2,6,23,0.28)]">
        <QRCodeSVG
          value={joinUrl}
          size={size}
          bgColor="#F8FAFC"
          fgColor="#0F172A"
          includeMargin
        />
      </div>
      <div className="text-center text-xs break-all text-slate-300">{joinUrl}</div>
    </div>
  );
};

export default GroupQRCode;
