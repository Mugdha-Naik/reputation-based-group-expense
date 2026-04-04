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
    <CenteredCard cardClassName="border-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Create Account
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              className="w-full bg-gray-900 border-b border-white outline-none py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your Gmail address"
              className="w-full bg-gray-900 border-b border-white outline-none py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-xs text-gray-400">
              Registration is currently limited to verified Gmail-style accounts.
            </p>
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full bg-gray-900 border-b border-white outline-none py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-2">
          <hr className="flex-grow border-gray-600" />
          <span className="text-sm">OR</span>
          <hr className="flex-grow border-gray-600" />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-black hover:bg-gray-200"
          onClick={handleGoogleRegister}
        >
          <FcGoogle />
          {googleLoading ? "Checking Google Sign-In..." : "Continue with Google"}
        </button>

        {!googleLoading && googleMessage && (
          <p className="mt-3 text-center text-xs text-gray-400">{googleMessage}</p>
        )}

        <p
          className="text-sm text-center mt-4 cursor-pointer text-blue-400"
          onClick={() => router.push("/login")}
        >
          Already have an account? Login
        </p>

    </CenteredCard>
  );
}
