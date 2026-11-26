"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginAdmin } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginAdmin(username, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-blue-600 shadow-xs">
              <Image
                src="/images/logo-parkinsight.jpeg"
                alt="Logo ParkInsight"
                fill
                sizes="56px"
                priority
                className="scale-[1.34] object-cover"
              />
            </div>
            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Masuk Pengelola
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              ParkInsight — Lahan Parkir Triguna UIN Jakarta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
