"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import UPIPaymentQRCode from "@/components/UPIPaymentQRCode";
import {
  buildUpiPaymentUrl,
  handleUPIPayment,
  isMobileDevice,
} from "@/lib/upi";

type PaymentMethod = "UPI" | "Cash";
type SettlementStatus = "pending" | "completed";
type SplitType = "Equal" | "Custom";
type ExpenseCategory =
  | "Food"
  | "Travel"
  | "Grocery"
  | "Shopping"
  | "Medical"
  | "Entertainment"
  | "Utilities"
  | "Other";

interface Member {
  _id: string;
  name: string;
  email?: string;
  image?: string;
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

interface ReceiptExtraction {
  merchant: string;
  total: number;
  date: string;
  category: string;
  items: string[];
}

const getFallbackUpiId = (name: string) =>
  `${name.toLowerCase().replace(/\s+/g, "")}@upi`;

const expenseCategories: ExpenseCategory[] = [
  "Food",
  "Travel",
  "Grocery",
  "Shopping",
  "Medical",
  "Entertainment",
  "Utilities",
  "Other",
];

export default function TripPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<SplitType>("Equal");
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [billImage, setBillImage] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [extractedReceipt, setExtractedReceipt] = useState<ReceiptExtraction | null>(null);
  const [extractingReceipt, setExtractingReceipt] = useState(false);
  const [extractInfo, setExtractInfo] = useState("");
  const [title, setTitle] = useState("Group Expense");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
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
  const [showUpiQrFallback, setShowUpiQrFallback] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

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

      const nextMembers = Array.isArray(membersData.members) ? membersData.members : [];
      setMembers(nextMembers);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
      setSelectedParticipants(nextMembers.map((member: Member) => member._id));
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to load trip data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    if (!groupId) return;
    fetchPageData();
  }, [fetchPageData, groupId, router, status]);

  useEffect(() => {
    if (searchParams.get("openExpense") === "1") {
      setExpenseModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!expenseModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [expenseModalOpen]);

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

    return pendingSettlements.filter((settlement) => settlement.fromUser?._id === userId);
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
        base[settlement.fromUser._id] = (base[settlement.fromUser._id] || 0) - settlement.amount;
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
      activeSettlement.toUser.upiId || getFallbackUpiId(activeSettlement.toUser.name);

    return buildUpiPaymentUrl({
      upiId: payeeUpi,
      name: activeSettlement.toUser.name,
      amount: activeSettlement.amount,
      currency: "INR",
    });
  }, [activeSettlement]);

  const activeSettlementUpiId = activeSettlement
    ? activeSettlement.toUser.upiId || getFallbackUpiId(activeSettlement.toUser.name)
    : "";

  const effectiveParticipants =
    splitType === "Equal" ? members.map((member) => member._id) : selectedParticipants;

  const totalPendingAmount = pendingSettlements.reduce(
    (sum, settlement) => sum + settlement.amount,
    0
  );

  async function handleBillChange(file: File | undefined) {
    if (!file) {
      setBillImage("");
      setReceiptFile(null);
      setExtractedReceipt(null);
      setExtractInfo("");
      return;
    }

    try {
      setError("");
      const dataUrl = await readFileAsDataUrl(file);
      setBillImage(dataUrl);
      setReceiptFile(file);
      setExtractedReceipt(null);
      setExtractInfo("");
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
    setReceiptFile(null);
    setExtractedReceipt(null);
    setExtractInfo("Camera image saved. AI extraction currently works with uploaded files.");
    closeCamera();
  }

  async function handleExtractDetails() {
    if (!receiptFile) {
      setError("Please upload a receipt image first.");
      return;
    }

    try {
      setExtractingReceipt(true);
      setError("");
      setSuccess("");
      setExtractInfo("");

      const formData = new FormData();
      formData.append("receipt", receiptFile);

      const res = await fetch("/api/ai/receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to extract receipt details");
      }

      const extracted = data?.extracted as ReceiptExtraction | undefined;
      if (!extracted) {
        throw new Error("Receipt response did not include extracted data");
      }

      setExtractedReceipt(extracted);
      if (extracted.merchant?.trim()) {
        setTitle(extracted.merchant.trim());
      }
      if (typeof extracted.total === "number" && extracted.total > 0) {
        setAmount(String(extracted.total));
      }
      if (
        !data?.usedMockFallback &&
        expenseCategories.includes(extracted.category as ExpenseCategory)
      ) {
        setCategory(extracted.category as ExpenseCategory);
      }

      setExtractInfo(
        data?.usedMockFallback
          ? "AI quota is currently unavailable. Receipt preview was loaded, but please choose the category manually."
          : "Receipt details extracted. Review them before saving."
      );
    } catch (extractError) {
      const message =
        extractError instanceof Error
          ? extractError.message
          : "Failed to extract receipt details";
      setError(message);
    } finally {
      setExtractingReceipt(false);
    }
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

    if (effectiveParticipants.length === 0) {
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
          title,
          category,
          amount: numericAmount,
          participants: effectiveParticipants,
          paymentMethod,
          billImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create expense");
      }

      setSelectedParticipants(members.map((member) => member._id));
      setBillImage("");
      setReceiptFile(null);
      setExtractedReceipt(null);
      setExtractInfo("");
      setTitle("Group Expense");
      setCategory("Other");
      setAmount("");
      setSplitType("Equal");
      setSuccess("Expense split successfully");
      setExpenseModalOpen(false);
      closeCamera();
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
    setShowUpiQrFallback(!isMobileDevice());
    setActiveSettlement(settlement);
  }

  function closePayModal() {
    setActiveSettlement(null);
    setSettlementMethod("UPI");
    setPaymentError("");
    setPaymentSuccess("");
    setShowUpiQrFallback(false);
    setCopyFeedback("");
  }

  function openUPIApp() {
    if (!activeSettlement) {
      setPaymentError("No active settlement selected.");
      return;
    }

    const payeeUpi =
      activeSettlement.toUser.upiId || getFallbackUpiId(activeSettlement.toUser.name);

    const paymentAttempt = handleUPIPayment({
      upiId: payeeUpi,
      name: activeSettlement.toUser.name,
      amount: activeSettlement.amount,
      currency: "INR",
    });

    if (!paymentAttempt.opened) {
      setPaymentError(paymentAttempt.message || "Unable to start UPI payment.");
      if (paymentAttempt.reason === "desktop") {
        setShowUpiQrFallback(true);
      }
      return;
    }

    setPaymentError("");
    setShowUpiQrFallback(false);
  }

  async function copyPaymentValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(`${label} copied.`);
    } catch {
      setCopyFeedback(`Could not copy ${label.toLowerCase()}. Please copy it manually.`);
    }
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

  if (loading || status === "loading") {
    return (
      <PageContainer className="bg-[#07111f]">
        <p className="text-sm text-slate-300">Loading trip details...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(145deg,#020617_0%,#0f172a_46%,#111827_100%)]">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
          <Card className="p-6">
            <Badge variant="cyan">Expense Flow</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-white">Add and settle smarter</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Capture bills, split them cleanly, and keep the group updated with a polished flow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="px-5 py-3"
                onClick={() => {
                  setExpenseModalOpen(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Add Expense
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/groups/${groupId}`)}>
                Back to Group
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending Dues</p>
            <p className="mt-3 text-3xl font-semibold text-white">{pendingSettlements.length}</p>
            <p className="mt-2 text-sm text-slate-400">INR {formatAmount(totalPendingAmount)} unresolved</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Participants</p>
            <p className="mt-3 text-3xl font-semibold text-white">{members.length}</p>
            <p className="mt-2 text-sm text-slate-400">Ready for equal or custom splits</p>
          </Card>
        </div>

        {userOwes.length > 0 && (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">You Owe</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Complete pending payments from here.
                </p>
              </div>
              <Badge variant="amber">{userOwes.length} pending</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {userOwes.map((settlement, index) => (
  <div
    key={`${settlement._id}-${index}`}
    className="rounded-[24px] border border-white/8 bg-slate-950/55 p-4"
  >
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-slate-400">Pay</p>
        <p className="mt-1 text-base font-semibold text-white">
          {settlement.toUser.name}
        </p>
        <p className="mt-1 text-sm text-slate-400">Pending settlement</p>
      </div>
      <div className="sm:text-right">
        <p className="text-xl font-semibold text-white">
          INR {formatAmount(settlement.amount)}
        </p>
        <Button
          className="mt-3 w-full sm:w-auto"
          onClick={() => openPayModal(settlement)}
        >
          Pay Now
        </Button>
      </div>
    </div>
  </div>
))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white">Balances</h2>
            {balances.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No members are available yet. Add people to this group to start splitting expenses.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {balances.map((entry, index) => {
  const color =
    entry.amount > 0
      ? "text-emerald-300"
      : entry.amount < 0
      ? "text-rose-300"
      : "text-slate-300";

  const prefix = entry.amount > 0 ? "+" : "";

  return (
    <div
      key={`${entry.memberId}-${index}`}
      className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-950/55 px-4 py-3 text-sm"
    >
      <span className="text-white">{entry.memberName}</span>
      <span className={color}>
        {prefix}INR {formatAmount(entry.amount)}
      </span>
    </div>
  );
})}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Settlement History</h2>
              <Badge variant="slate">{settlements.length} entries</Badge>
            </div>
            {settlements.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No settlements yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {settlements.map((settlement, index) => {
  const isDebtor = settlement.fromUser?._id === session?.user?.id;

  return (
    <div
      key={`${settlement._id}-${settlement.fromUser?._id}-${settlement.toUser?._id}-${index}`}
      className="rounded-2xl border border-white/8 bg-slate-950/55 p-4 text-sm"
    >
      <p className="text-white">
        {settlement.fromUser.name} to {settlement.toUser.name} INR{" "}
        {formatAmount(settlement.amount)}
      </p>

      {settlement.status === "completed" ? (
        <p className="mt-2 text-emerald-300">Completed</p>
      ) : isDebtor ? (
        <Button className="mt-3" onClick={() => openPayModal(settlement)}>
          Pay Now
        </Button>
      ) : (
        <p className="mt-2 text-amber-300">Pending</p>
      )}
    </div>
  );
})}
              </div>
            )}
          </Card>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        )}
        {paymentSuccess && (
          <p className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {paymentSuccess}
          </p>
        )}
      </div>

      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 px-4 py-8 backdrop-blur-md">
          <div className="mx-auto w-full max-w-3xl">
            <Card className="p-0">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  <Badge variant="violet">New Expense</Badge>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Add group expense</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Minimal modal, cleaner inputs, and smooth split controls.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setExpenseModalOpen(false);
                    closeCamera();
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="expense-title" className="text-sm font-medium text-white">
                      Title
                    </label>
                    <input
                      id="expense-title"
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Enter expense title"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="expense-amount" className="text-sm font-medium text-white">
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
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="expense-category" className="text-sm font-medium text-white">
                      Category
                    </label>
                    <select
                      id="expense-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
                    >
                      {expenseCategories.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-400">
                      AI category is only a suggestion. Review it before saving.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">Payment Method</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
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
                              if (method === "Cash") {
                                setReceiptFile(null);
                                setExtractedReceipt(null);
                                setExtractInfo("");
                              }
                              setPaymentMethod(method);
                            }}
                            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                              active
                                ? "border-cyan-400/35 bg-cyan-400/12 text-cyan-200"
                                : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                            }`}
                          >
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">Split Type</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(["Equal", "Custom"] as SplitType[]).map((option) => {
                      const active = splitType === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSplitType(option)}
                          className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                            active
                              ? "border-violet-400/35 bg-violet-400/12 text-violet-200"
                              : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Equal splits with everyone. Custom lets you pick exactly who joins.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-white">Bill Upload</p>
                  {paymentMethod === "Cash" ? (
                    <div className="mt-3">
                      <Button variant="secondary" className="w-full py-3" onClick={openCamera}>
                        Click a Photo
                      </Button>
                      {cameraOpen && (
                        <div className="mt-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-3">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full rounded-2xl bg-black"
                          />
                          <div className="mt-3 flex gap-3">
                            <Button className="flex-1" onClick={captureFromCamera} disabled={!cameraReady}>
                              Capture Photo
                            </Button>
                            <Button variant="secondary" className="flex-1" onClick={closeCamera}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="mt-3 block rounded-[24px] border border-dashed border-white/15 bg-slate-950/55 px-4 py-5">
                      <span className="block text-sm text-slate-200">Select from device</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        Upload a receipt image for preview and optional extraction.
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleBillChange(event.target.files?.[0])}
                        className="mt-4 block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white"
                      />
                    </label>
                  )}

                  {billImage && (
                    <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/60 p-3">
                      <img
                        src={billImage}
                        alt="Bill preview"
                        className="max-h-56 w-full rounded-2xl object-contain"
                      />
                    </div>
                  )}

                  {paymentMethod !== "Cash" && (
                    <Button
                      variant="secondary"
                      className="mt-4 w-full py-3"
                      onClick={handleExtractDetails}
                      disabled={!receiptFile || extractingReceipt}
                    >
                      {extractingReceipt ? "Extracting..." : "Extract Details"}
                    </Button>
                  )}

                  {extractInfo && (
                    <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-100">
                      {extractInfo}
                    </p>
                  )}

                  {extractedReceipt && (
                    <div className="mt-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-4 text-sm">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Extracted Details
                      </p>
                      <div className="mt-3 grid gap-2 text-slate-200 sm:grid-cols-2">
                        <p>
                          Merchant:{" "}
                          <span className="text-white">{extractedReceipt.merchant || "Not found"}</span>
                        </p>
                        <p>
                          Total:{" "}
                          <span className="text-white">
                            {extractedReceipt.total > 0
                              ? `INR ${formatAmount(extractedReceipt.total)}`
                              : "Not found"}
                          </span>
                        </p>
                        <p>
                          Date: <span className="text-white">{extractedReceipt.date || "Not found"}</span>
                        </p>
                        <p>
                          Category:{" "}
                          <span className="text-white">{extractedReceipt.category || "Not found"}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Participants</p>
                    <Badge variant="slate">
                      {splitType === "Equal"
                        ? `${members.length} selected`
                        : `${selectedParticipants.length} selected`}
                    </Badge>
                  </div>
                  {splitType === "Custom" ? (
                    members.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-400">
                        No participants available yet. Add members to this group first.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {members.map((member) => {
                          const selected = selectedParticipants.includes(member._id);
                          return (
                            <button
                              key={member._id}
                              type="button"
                              onClick={() => toggleParticipant(member._id)}
                              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? "border-cyan-400/35 bg-cyan-400/10"
                                  : "border-white/10 bg-slate-950/60 hover:border-white/20"
                              }`}
                            >
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name}
                                  className="h-10 w-10 rounded-2xl object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-sm font-semibold text-white">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-white">{member.name}</p>
                                <p className="text-xs text-slate-400">
                                  {selected ? "Included" : "Tap to include"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="mt-3 rounded-[24px] border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
                      This expense will be split equally across all current group members.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setExpenseModalOpen(false);
                      closeCamera();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSplitExpense} disabled={submittingExpense} className="min-w-44 py-3">
                    {submittingExpense ? "Splitting..." : "Split Expense"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md">
            <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Settle Payment</h3>
                <p className="mt-2 text-sm text-slate-300">
                  You owe {activeSettlement.toUser.name} INR{" "}
                  {formatAmount(activeSettlement.amount)}
                </p>
              </div>
              <Button variant="ghost" onClick={closePayModal}>
                Close
              </Button>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payee</p>
              <p className="mt-2 text-base font-semibold text-white">{activeSettlement.toUser.name}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Amount</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    INR {formatAmount(activeSettlement.amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">UPI ID</p>
                  <p className="mt-2 break-all text-sm text-slate-200">{activeSettlementUpiId}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-white">Payment Method</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["UPI", "Cash"] as PaymentMethod[]).map((method) => {
                  const active = settlementMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSettlementMethod(method)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "border-cyan-400/35 bg-cyan-400/12 text-cyan-200"
                          : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            {settlementMethod === "UPI" ? (
              <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-300">
                  Open your UPI app to pay {activeSettlement.toUser.name}. After you complete the
                  payment, come back and mark it as paid.
                </p>
                <Button
                  className="w-full py-3"
                  onClick={openUPIApp}
                  type="button"
                >
                  {showUpiQrFallback ? "Open UPI App on Mobile" : "Open UPI App"}
                </Button>
                {showUpiQrFallback ? (
                  <p className="text-xs text-slate-400">
                    This device looks like desktop, so the best flow is to scan the QR from your
                    phone or copy the payment details below.
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Mobile devices will show the installed UPI apps chooser automatically if your
                    browser supports UPI intents.
                  </p>
                )}

                {showUpiQrFallback ? (
                  <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-4">
                    <p className="text-sm font-medium text-white">Desktop payment options</p>
                    <p className="mt-2 text-sm text-slate-300">
                      UPI deep links usually open only on mobile. Scan this QR with any UPI app on
                      your phone, or use the quick copy buttons below.
                    </p>
                    <div className="mt-4">
                      <UPIPaymentQRCode upiUrl={upiLink} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => copyPaymentValue(activeSettlementUpiId, "UPI ID")}
                      >
                        Copy UPI ID
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() =>
                          copyPaymentValue(formatAmount(activeSettlement.amount), "Amount")
                        }
                      >
                        Copy Amount
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => copyPaymentValue(upiLink, "UPI link")}
                      >
                        Copy UPI Link
                      </Button>
                    </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        UPI Intent Link
                      </p>
                      <p className="mt-2 break-all text-xs text-slate-300">{upiLink}</p>
                    </div>
                    {copyFeedback ? (
                      <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-100">
                        {copyFeedback}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <Button
                  variant="secondary"
                  className="w-full py-3"
                  onClick={() => markSettlementPaid(activeSettlement._id)}
                  disabled={payingSettlement}
                >
                  {payingSettlement ? "Updating..." : "I Have Paid"}
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm text-slate-200">
                  Confirm that you paid {activeSettlement.toUser.name} INR{" "}
                  {formatAmount(activeSettlement.amount)} in cash.
                </p>
                <Button
                  className="w-full py-3"
                  onClick={() => markSettlementPaid(activeSettlement._id)}
                  disabled={payingSettlement}
                >
                  {payingSettlement ? "Updating..." : "Confirm Payment"}
                </Button>
              </div>
            )}

            {paymentError && (
              <p className="mt-3 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {paymentError}
              </p>
            )}
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
