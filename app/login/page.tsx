"use client";

import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

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
    <CenteredCard cardClassName="border-white p-6 sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold">Login</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-5 sm:space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="mb-1 block">Email</label>
            <input
              type="email"
              className="w-full border-b border-white bg-gray-900 py-2 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block">Password</label>
            <input
              type="password"
              className="w-full border-b border-white bg-gray-900 py-2 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2 font-semibold text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          className="mt-4 cursor-pointer text-center text-sm text-blue-400"
          onClick={() => router.push("/register")}
        >
          Don&apos;t have an account? Register
        </p>

        <div className="my-6 flex items-center gap-2">
          <hr className="flex-grow border-gray-600" />
          <span className="text-sm">OR</span>
          <hr className="flex-grow border-gray-600" />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-black hover:bg-gray-200"
          onClick={handleGoogleLogin}
        >
          <FcGoogle />
          {googleLoading ? "Checking Google Sign-In..." : "Sign in with Google"}
        </button>

        {!googleLoading && googleMessage && (
          <p className="mt-3 text-center text-xs text-gray-400">{googleMessage}</p>
        )}
    </CenteredCard>
  );
}
