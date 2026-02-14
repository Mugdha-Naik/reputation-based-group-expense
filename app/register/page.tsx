"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import CenteredCard from "@/components/layout/CenteredCard";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    // ✅ client-side validation
    if (!name || !email || !password) {
      setError("All fields are required");
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
        email,
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
              placeholder="Enter email"
              className="w-full bg-gray-900 border-b border-white outline-none py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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

        <p
          className="text-sm text-center mt-4 cursor-pointer text-blue-400"
          onClick={() => router.push("/login")}
        >
          Already have an account? Login
        </p>

    </CenteredCard>
  );
}
