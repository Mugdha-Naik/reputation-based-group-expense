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
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://127.0.0.1:3000";
  const joinUrl = `${appUrl}/join/${groupId}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG
        value={joinUrl}
        size={size}
        bgColor="transparent"
        fgColor="#E2E8F0"
        includeMargin
      />
      <div className="text-center text-xs break-all text-slate-300">{joinUrl}</div>
    </div>
  );
};

export default GroupQRCode;
