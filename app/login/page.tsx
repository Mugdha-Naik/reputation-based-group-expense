"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import CenteredCard from "@/components/layout/CenteredCard";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-black hover:bg-gray-200"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <FcGoogle />
          Sign in with Google
        </button>
    </CenteredCard>
  );
}
