"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface GroupQRCodeProps {
  groupId: string;
}

const GroupQRCode: React.FC<GroupQRCodeProps> = ({ groupId }) => {
  if (!groupId) return null;

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${groupId}`
      : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCodeSVG value={joinUrl} size={180} />
      <div className="text-xs break-all text-center">{joinUrl}</div>
    </div>
  );
};

export default GroupQRCode;