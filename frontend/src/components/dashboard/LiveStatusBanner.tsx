"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { DashboardSummaryResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LiveStatusBannerProps {
  summary: DashboardSummaryResponse;
  isFetching: boolean;
}

export function LiveStatusBanner({
  summary,
  isFetching,
}: LiveStatusBannerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Ketersediaan Parkir
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {summary.recommendation.headline} — {summary.recommendation.detail}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-600 tabular-nums">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              summary.isStale
                ? "bg-amber-500"
                : summary.isOffHours
                  ? "bg-slate-400"
                  : "bg-emerald-500",
            )}
          />
          <span>Diperbarui {summary.lastUpdatedLabel}</span>
          <RefreshCw
            className={cn(
              "h-3 w-3 text-slate-400",
              isFetching && "animate-spin text-blue-600",
            )}
          />
        </div>
      </div>

      {summary.recommendation.alternativeSuggestion && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs font-medium text-rose-900">
          {summary.recommendation.alternativeSuggestion}
        </div>
      )}

      {summary.isStale && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Pembaruan data tertunda ({summary.minutesSinceUpdate} menit lalu).
            Menampilkan catatan terakhir.
          </span>
        </div>
      )}
    </div>
  );
}
