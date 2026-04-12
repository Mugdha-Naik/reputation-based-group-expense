"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type SplitType = "Equal" | "Custom";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string; // ✅ added
  members: { _id: string }[]; // ✅ added
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
}: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("Equal");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const disabled = useMemo(
    () => !amount.trim() || !description.trim(),
    [amount, description]
  );

  if (!isOpen) return null;

  // convert to base64
  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  // submit handler
  const handleSubmit = async () => {
    try {
      let imageBase64 = "";

      if (selectedFile) {
        imageBase64 = await convertToBase64(selectedFile);
      }

      await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId, // ✅ dynamic
          title: description,
          amount: Number(amount),
          paymentMethod: "UPI",

          // ✅ FIXED
          splitAmong: members.map((m) => m._id),

          billImage: imageBase64,
        }),
      });

      onClose();
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-lg">
        <Card className="p-0">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <Badge variant="violet">Quick Add</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white">Add Expense</h2>
              <p className="mt-2 text-sm text-slate-300">
                Rounded inputs, subtle blur, and a simple split toggle.
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="space-y-5 px-6 py-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-white">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white">Description</label>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-white">
                Upload Receipt
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="mt-2 text-sm text-white"
              />

              {selectedFile && (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Receipt preview"
                  className="mt-3 w-24 h-24 object-cover rounded-lg border border-white/10"
                />
              )}
            </div>

            {/* Split Type */}
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
                          ? "border-cyan-400/35 bg-cyan-400/12 text-cyan-200"
                          : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={disabled}
                className="min-w-36 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 text-slate-950"
              >
                Add Expense
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
