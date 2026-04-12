"use client";

import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleMessage, setGoogleMessage] = useState("");

  const router = useRouter();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
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
      outerClassName="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#111827_100%)]"
      cardClassName="text-white border-white/10 bg-white/6 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,6,23,0.55)] p-6 sm:p-8 rounded-[32px]"
    >
        <div className="text-center">
          <Badge variant="cyan">Welcome Back</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Login</h1>
          <p className="mt-3 text-sm text-slate-300">
            Sign in to continue managing groups and settlements.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-5 sm:space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-white">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-300">
          <span>Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="font-semibold text-cyan-200 underline-offset-4 hover:underline"
          >
            Register
          </button>
        </div>

        <div className="my-6 flex items-center gap-2">
          <hr className="flex-grow border-white/10" />
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">OR</span>
          <hr className="flex-grow border-white/10" />
        </div>

        <Button
          type="button"
          disabled={googleLoading}
          variant="secondary"
          className="flex w-full items-center justify-center gap-2 py-3"
          onClick={handleGoogleLogin}
        >
          <FcGoogle />
          {googleLoading ? "Checking Google Sign-In..." : "Sign in with Google"}
        </Button>

        {!googleLoading && googleMessage && (
          <p className="mt-3 text-center text-xs text-slate-400">{googleMessage}</p>
        )}
    </CenteredCard>
  );
}
