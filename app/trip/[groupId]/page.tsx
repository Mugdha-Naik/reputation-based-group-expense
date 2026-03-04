"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/layout/PageContainer";

type PaymentMethod = "UPI" | "Cash";
type SettlementStatus = "pending" | "completed";

interface Member {
  _id: string;
  name: string;
  email?: string;
}

interface SettlementUser {
  _id: string;
  name: string;
  upiId?: string;
}

interface Settlement {
  _id: string;
  fromUser: SettlementUser;
  toUser: SettlementUser;
  amount: number;
  status: SettlementStatus;
}

export default function TripPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { data: session } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [billImage, setBillImage] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [payingSettlement, setPayingSettlement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [activeSettlement, setActiveSettlement] = useState<Settlement | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>("UPI");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatAmount = (value: number) =>
    Number.isInteger(value) ? value.toString() : value.toFixed(2);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, settlementsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/members`, { credentials: "include" }),
        fetch(`/api/settlement/${groupId}`, { credentials: "include" }),
      ]);

      if (!membersRes.ok) {
        throw new Error("Failed to fetch members");
      }
      if (!settlementsRes.ok) {
        throw new Error("Failed to fetch settlements");
      }

      const membersData = await membersRes.json();
      const settlementsData = await settlementsRes.json();

      setMembers(Array.isArray(membersData.members) ? membersData.members : []);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to load trip data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    fetchPageData();
  }, [groupId, fetchPageData]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const pendingSettlements = useMemo(
    () => settlements.filter((settlement) => settlement.status === "pending"),
    [settlements]
  );

  const userOwes = useMemo(() => {
    const userId = session?.user?.id;
    if (!userId) return [];

    return pendingSettlements.filter(
      (settlement) => settlement.fromUser?._id === userId
    );
  }, [pendingSettlements, session?.user?.id]);

  const balances = useMemo(() => {
    const base: Record<string, number> = {};
    members.forEach((member) => {
      base[member._id] = 0;
    });

    pendingSettlements.forEach((settlement) => {
      if (settlement.toUser?._id) {
        base[settlement.toUser._id] = (base[settlement.toUser._id] || 0) + settlement.amount;
      }
      if (settlement.fromUser?._id) {
        base[settlement.fromUser._id] =
          (base[settlement.fromUser._id] || 0) - settlement.amount;
      }
    });

    return members.map((member) => ({
      memberId: member._id,
      memberName: member.name,
      amount: base[member._id] || 0,
    }));
  }, [members, pendingSettlements]);

  const upiLink = useMemo(() => {
    if (!activeSettlement) return "#";
    const payeeUpi =
      activeSettlement.toUser.upiId ||
      `${activeSettlement.toUser.name.toLowerCase().replace(/\s+/g, "")}@upi`;

    return `upi://pay?pa=${encodeURIComponent(payeeUpi)}&pn=${encodeURIComponent(
      activeSettlement.toUser.name
    )}&am=${encodeURIComponent(formatAmount(activeSettlement.amount))}`;
  }, [activeSettlement]);

  async function handleBillChange(file: File | undefined) {
    if (!file) {
      setBillImage("");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBillImage(dataUrl);
    } catch {
      setError("Failed to process bill image");
    }
  }

  async function openCamera() {
    try {
      setError("");
      setCameraReady(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setError("Unable to open camera. Please allow camera permission.");
      setCameraOpen(false);
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraReady(false);
  }

  function captureFromCamera() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Failed to capture photo");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setBillImage(imageDataUrl);
    closeCamera();
  }

  function toggleParticipant(memberId: string) {
    setSelectedParticipants((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function handleSplitExpense() {
    const paidBy = session?.user?.id;
    const numericAmount = Number(amount);

    if (!paidBy) {
      setError("You must be logged in");
      return;
    }

    if (!groupId) {
      setError("Invalid group");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount greater than 0");
      return;
    }

    if (selectedParticipants.length === 0) {
      setError("Select at least one participant");
      return;
    }

    if (!billImage) {
      setError("Please attach a bill image");
      return;
    }

    try {
      setSubmittingExpense(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          groupId,
          paidBy,
          amount: numericAmount,
          participants: selectedParticipants,
          paymentMethod,
          billImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create expense");
      }

      setSelectedParticipants([]);
      setBillImage("");
      setAmount("");
      setSuccess("Expense split successfully");
      await fetchPageData();
    } catch (splitError) {
      const message =
        splitError instanceof Error ? splitError.message : "Failed to create expense";
      setError(message);
    } finally {
      setSubmittingExpense(false);
    }
  }

  function openPayModal(settlement: Settlement) {
    setSettlementMethod("UPI");
    setPaymentError("");
    setPaymentSuccess("");
    setActiveSettlement(settlement);
  }

  function closePayModal() {
    setActiveSettlement(null);
    setSettlementMethod("UPI");
    setPaymentError("");
  }

  async function markSettlementPaid(settlementId: string) {
    try {
      setPayingSettlement(true);
      setPaymentError("");
      setPaymentSuccess("");

      const res = await fetch("/api/settlement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settlementId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update settlement");
      }

      setPaymentSuccess("Payment marked as completed");
      await fetchPageData();
      closePayModal();
    } catch (markError) {
      const message =
        markError instanceof Error ? markError.message : "Failed to complete payment";
      setPaymentError(message);
    } finally {
      setPayingSettlement(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <p className="text-sm text-gray-300">Loading trip details...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-md space-y-4 pb-8">
        {userOwes.length > 0 && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="text-lg font-semibold text-white">You Owe</h2>
            <div className="mt-3 space-y-3">
              {userOwes.map((settlement) => (
                <div
                  key={settlement._id}
                  className="rounded-lg border border-gray-700 bg-gray-950 p-3"
                >
                  <p className="text-sm text-white">
                    {settlement.toUser.name} ₹{formatAmount(settlement.amount)}
                  </p>
                  <button
                    type="button"
                    onClick={() => openPayModal(settlement)}
                    className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Pay Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-lg font-semibold text-white">Balances</h2>
          <div className="mt-3 space-y-2">
            {balances.map((entry) => {
              const color =
                entry.amount > 0
                  ? "text-green-400"
                  : entry.amount < 0
                    ? "text-red-400"
                    : "text-gray-300";
              const prefix = entry.amount > 0 ? "+" : "";
              return (
                <div key={entry.memberId} className="flex items-center justify-between text-sm">
                  <span className="text-white">{entry.memberName}</span>
                  <span className={color}>
                    {prefix}₹{formatAmount(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-lg font-semibold text-white">Add Expense</h2>

          <div>
            <p className="text-sm font-semibold text-white">Payment Method</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["UPI", "Cash"] as PaymentMethod[]).map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      if (method !== "Cash") {
                        closeCamera();
                      }
                      setPaymentMethod(method);
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-gray-700 bg-gray-950 text-gray-200"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Bill Upload</p>
            {paymentMethod === "Cash" ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={openCamera}
                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Click a Photo
                </button>
                {cameraOpen && (
                  <div className="mt-3 space-y-2 rounded-lg border border-gray-700 p-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full rounded-md bg-black"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={captureFromCamera}
                        disabled={!cameraReady}
                        className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={closeCamera}
                        className="flex-1 rounded-md border border-gray-600 px-3 py-2 text-xs font-medium text-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <label className="mt-2 block">
                <span className="mb-2 block text-xs text-gray-400">Select from Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleBillChange(event.target.files?.[0])}
                  className="block w-full text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white"
                />
              </label>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Select Participants</p>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {members.map((member) => {
                const selected = selectedParticipants.includes(member._id);
                return (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => toggleParticipant(member._id)}
                    className="flex flex-col items-center gap-2 rounded-lg p-2"
                  >
                    <span
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        selected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-500 bg-transparent"
                      }`}
                    />
                    <span className="text-center text-xs text-gray-200">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="expense-amount" className="text-sm font-semibold text-white">
              Amount
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSplitExpense}
            disabled={submittingExpense}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submittingExpense ? "Splitting..." : "Split Expense"}
          </button>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-lg font-semibold text-white">Settlement History</h2>
          {settlements.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">No settlements yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {settlements.map((settlement) => {
                const isDebtor = settlement.fromUser?._id === session?.user?.id;
                return (
                  <div
                    key={settlement._id}
                    className="rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm"
                  >
                    <p className="text-white">
                      {settlement.fromUser.name} → {settlement.toUser.name} ₹
                      {formatAmount(settlement.amount)}
                    </p>
                    {settlement.status === "completed" ? (
                      <p className="mt-2 text-green-400">Completed</p>
                    ) : isDebtor ? (
                      <button
                        type="button"
                        onClick={() => openPayModal(settlement)}
                        className="mt-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <p className="mt-2 text-yellow-300">Pending</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {success}
          </p>
        )}
        {paymentSuccess && (
          <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {paymentSuccess}
          </p>
        )}
      </div>

      {activeSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-4">
            <h3 className="text-lg font-semibold text-white">Settle Payment</h3>
            <p className="mt-2 text-sm text-gray-200">
              You owe {activeSettlement.toUser.name} ₹{formatAmount(activeSettlement.amount)}
            </p>

            <div className="mt-4">
              <p className="text-sm font-semibold text-white">Payment Method</p>
              <div className="mt-2 space-y-2 text-sm text-gray-200">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="settlementMethod"
                    checked={settlementMethod === "UPI"}
                    onChange={() => setSettlementMethod("UPI")}
                  />
                  UPI
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="settlementMethod"
                    checked={settlementMethod === "Cash"}
                    onChange={() => setSettlementMethod("Cash")}
                  />
                  Cash
                </label>
              </div>
            </div>

            {settlementMethod === "UPI" ? (
              <div className="mt-4 space-y-2">
                <a
                  href={upiLink}
                  className="block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-500"
                >
                  Open UPI App
                </a>
                <button
                  type="button"
                  onClick={() => markSettlementPaid(activeSettlement._id)}
                  disabled={payingSettlement}
                  className="w-full rounded-md border border-gray-600 px-3 py-2 text-sm text-white"
                >
                  Mark as Paid
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-200">
                  Confirm you paid {activeSettlement.toUser.name} ₹
                  {formatAmount(activeSettlement.amount)} in cash
                </p>
                <button
                  type="button"
                  onClick={() => markSettlementPaid(activeSettlement._id)}
                  disabled={payingSettlement}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Confirm Payment
                </button>
              </div>
            )}

            {paymentError && (
              <p className="mt-3 text-xs text-red-300">{paymentError}</p>
            )}

            <button
              type="button"
              onClick={closePayModal}
              className="mt-4 w-full rounded-md border border-gray-600 px-3 py-2 text-sm text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
