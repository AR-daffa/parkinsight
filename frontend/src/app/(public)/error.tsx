"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function PublicError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-base font-bold text-slate-900">
        Terjadi kendala saat memuat data
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {error.message || "Silakan muat ulang halaman untuk mencoba kembali."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <RotateCcw className="h-4 w-4" />
        Coba Lagi
      </button>
    </Card>
  );
}
