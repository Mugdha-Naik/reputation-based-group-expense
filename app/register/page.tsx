"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleMessage, setGoogleMessage] = useState("");

  const router = useRouter();
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const response = await fetch("/api/auth/google-status");
        const data = (await response.json()) as {
          enabled?: boolean;
          message?: string;
        };

        setGoogleReady(Boolean(data.enabled));
        setGoogleMessage(data.message || "");
      } catch {
        setGoogleReady(false);
        setGoogleMessage("Google sign-in status could not be checked right now.");
      } finally {
        setGoogleLoading(false);
      }
    };

    void checkGoogleAuth();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    // ✅ client-side validation
    if (!name || !normalizedEmail || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (!normalizedEmail.endsWith("@gmail.com")) {
      setError("Only original Gmail addresses are allowed for registration");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/api/auth/register", {
        name,
        email: normalizedEmail,
        password,
      });

      alert(res.data.message || "Registration successful");
      router.push("/login");
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? ((err as AxiosError<{ message?: string }>).response?.data?.message ??
          err.message)
        : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");

    if (!googleReady) {
      setError(
        googleMessage ||
          "Google sign-in is not configured yet. Add Google credentials in .env.local."
      );
      return;
    }

    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <CenteredCard
      outerClassName="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.14),_transparent_22%),linear-gradient(180deg,#07111f_0%,#0f172a_48%,#111827_100%)]"
      cardClassName="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(17,24,39,0.9))] p-7 text-white shadow-[0_24px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:p-9"
    >
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Get Started</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Start tracking shared expenses with a cleaner, trusted workflow.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5 sm:space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-slate-950"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              placeholder="Enter your Gmail address"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-slate-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-400">
              Registration is currently limited to verified Gmail-style accounts.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-slate-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-violet-500 px-5 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(99,102,241,0.34)] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3">
          <hr className="flex-grow border-white/12" />
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Or</span>
          <hr className="flex-grow border-white/12" />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-white transition hover:bg-white/12 disabled:opacity-60"
          onClick={handleGoogleRegister}
        >
          <FcGoogle />
          {googleLoading ? "Checking Google Sign-In..." : "Continue with Google"}
        </button>

        {!googleLoading && googleMessage && (
          <p className="mt-3 text-center text-xs text-slate-400">{googleMessage}</p>
        )}

        <p
          className="mt-5 cursor-pointer text-center text-sm text-cyan-300 transition hover:text-cyan-200"
          onClick={() => router.push("/login")}
        >
          Already have an account? Login
        </p>

    </CenteredCard>
  );
}
