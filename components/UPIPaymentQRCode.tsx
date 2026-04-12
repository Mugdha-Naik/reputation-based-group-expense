"use client";

import { QRCodeSVG } from "qrcode.react";

interface UPIPaymentQRCodeProps {
  upiUrl: string;
  size?: number;
}

export default function UPIPaymentQRCode({
  upiUrl,
  size = 180,
}: UPIPaymentQRCodeProps) {
  if (!upiUrl) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-[24px] border border-white/10 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
        <QRCodeSVG value={upiUrl} size={size} includeMargin />
      </div>
      <p className="text-center text-xs leading-5 text-slate-400">
        Scan this QR from any UPI app on your phone to continue the payment.
      </p>
    </div>
  );
}
