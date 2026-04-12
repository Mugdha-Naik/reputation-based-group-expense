"use client";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

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
<<<<<<< HEAD
      outerClassName="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_24%),radial-gradient(circle_at_right,_rgba(139,92,246,0.14),_transparent_22%),linear-gradient(180deg,#07111f_0%,#0f172a_48%,#111827_100%)]"
      cardClassName="rounded-[30px] border border-[var(--color-border)] bg-[linear-gradient(145deg,rgba(17,24,39,0.96),rgba(20,30,46,0.94))] p-7 text-white shadow-[var(--shadow-surface)] backdrop-blur-xl sm:p-9"
=======
      outerClassName="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]"
      cardClassName="text-white border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,6,23,0.55)] p-6 sm:p-8 rounded-[32px]"
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
    >
        <div className="text-center">
          <Badge variant="violet">Get Started</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Create account</h1>
          <p className="mt-3 text-sm text-slate-300">
            Join your groups and keep settlement history in one place.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-5 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-white">Name</label>
            <input
              type="text"
              placeholder="Enter name"
<<<<<<< HEAD
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(9,12,18,0.58)] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-[rgba(9,12,18,0.82)]"
=======
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Email</label>
            <input
              type="email"
              placeholder="Enter your Gmail address"
<<<<<<< HEAD
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(9,12,18,0.58)] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-[rgba(9,12,18,0.82)]"
=======
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-xs text-slate-400">
              Registration is currently limited to verified Gmail-style accounts.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Password</label>
            <input
              type="password"
              placeholder="Enter password"
<<<<<<< HEAD
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(9,12,18,0.58)] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 focus:bg-[rgba(9,12,18,0.82)]"
=======
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

<<<<<<< HEAD
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full border border-cyan-300/20 bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 px-5 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(59,130,246,0.28)] transition duration-300 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_44px_rgba(99,102,241,0.34)] disabled:opacity-50"
          >
=======
          <Button type="submit" disabled={loading} className="w-full py-3">
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-2">
          <hr className="flex-grow border-white/10" />
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">OR</span>
          <hr className="flex-grow border-white/10" />
        </div>

        <Button
          type="button"
          disabled={googleLoading}
<<<<<<< HEAD
          className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--color-border)] bg-white/5 px-5 py-3 text-white transition hover:border-[var(--color-border-strong)] hover:bg-white/8 disabled:opacity-60"
=======
          variant="secondary"
          className="flex w-full items-center justify-center gap-2 py-3"
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
          onClick={handleGoogleRegister}
        >
          <FcGoogle />
          {googleLoading ? "Checking Google Sign-In..." : "Continue with Google"}
        </Button>

        {!googleLoading && googleMessage && (
          <p className="mt-3 text-center text-xs text-slate-400">{googleMessage}</p>
        )}

        <div className="mt-5 text-center text-sm text-slate-300">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-cyan-200 underline-offset-4 hover:underline"
          >
            Login
          </button>
        </div>

    </CenteredCard>
  );
}
