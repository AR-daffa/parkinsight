"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboardSummary, useDashboardTrends } from "@/lib/hooks";
import { LiveStatusBanner } from "./LiveStatusBanner";
import { OccupancyCard } from "./OccupancyCard";
import { PredictionPanel } from "./PredictionPanel";

const TrendChart = dynamic(
  () => import("./TrendChart").then((mod) => mod.TrendChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-2xl" />,
  },
);

export function DashboardView() {
  const summaryQuery = useDashboardSummary();
  const trendsQuery = useDashboardTrends();

  if (summaryQuery.isLoading && !summaryQuery.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    throw summaryQuery.error ?? new Error("Gagal mengambil ringkasan parkir.");
  }

  const summary = summaryQuery.data;

  return (
    <div className="space-y-5">
      <LiveStatusBanner
        summary={summary}
        isFetching={summaryQuery.isFetching}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <OccupancyCard data={summary.vehicles.motor} />
        <OccupancyCard data={summary.vehicles.mobil} />
      </div>

      <PredictionPanel predictions={summary.predictions} />

      {trendsQuery.data ? (
        <TrendChart trends={trendsQuery.data} />
      ) : (
        <Skeleton className="h-72 w-full rounded-2xl" />
      )}
    </div>
  );
}
