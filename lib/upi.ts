"use client";

export interface UpiPaymentDetails {
  upiId: string;
  name: string;
  amount: number;
  currency?: "INR";
}

export interface UpiPaymentResult {
  opened: boolean;
  reason?: "desktop" | "invalid_upi" | "invalid_amount" | "unsupported_environment";
  message?: string;
  upiUrl?: string;
}

const DEFAULT_CURRENCY = "INR";

// Keep validation practical for common UPI handles without being overly strict.
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

export function isValidUpiId(upiId: string) {
  return UPI_ID_PATTERN.test(upiId.trim());
}

export function isValidUpiAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0;
}

export function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent || "";
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

export function buildUpiPaymentUrl({
  upiId,
  name,
  amount,
  currency = DEFAULT_CURRENCY,
}: UpiPaymentDetails) {
  const normalizedUpiId = upiId.trim();
  const normalizedName = name.trim();
  const normalizedAmount = amount.toFixed(2);

  return `upi://pay?pa=${encodeURIComponent(normalizedUpiId)}&pn=${encodeURIComponent(
    normalizedName
  )}&am=${encodeURIComponent(normalizedAmount)}&cu=${encodeURIComponent(currency)}`;
}

// This opens the native UPI intent only on supported mobile devices.
export function handleUPIPayment(details: UpiPaymentDetails): UpiPaymentResult {
  if (typeof window === "undefined") {
    return {
      opened: false,
      reason: "unsupported_environment",
      message: "UPI payments can only be started in the browser.",
    };
  }

  if (!isValidUpiId(details.upiId)) {
    return {
      opened: false,
      reason: "invalid_upi",
      message: "Enter a valid UPI ID before starting payment.",
    };
  }

  if (!isValidUpiAmount(details.amount)) {
    return {
      opened: false,
      reason: "invalid_amount",
      message: "Enter a valid payment amount greater than 0.",
    };
  }

  const upiUrl = buildUpiPaymentUrl(details);

  if (!isMobileDevice()) {
    return {
      opened: false,
      reason: "desktop",
      message: "UPI app opening works best on mobile. Use the QR code or pay from your phone.",
      upiUrl,
    };
  }

  window.location.href = upiUrl;

  return {
    opened: true,
    upiUrl,
  };
}
