"use client";

import { CalibrationForm } from "@/components/admin/CalibrationForm";
import { OccupancyCard } from "@/components/dashboard/OccupancyCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminMonitoring, useDashboardSummary } from "@/lib/hooks";

export default function AdminOverviewPage() {
  const summaryQuery = useDashboardSummary();
  const monitoringQuery = useAdminMonitoring();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Overview & Kalibrasi
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Ringkasan okupansi saat ini dan koreksi jumlah kendaraan terparkir.
        </p>
      </div>

      {summaryQuery.data && monitoringQuery.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <OccupancyCard data={summaryQuery.data.vehicles.motor} />
            <OccupancyCard data={summaryQuery.data.vehicles.mobil} />
          </div>
          <CalibrationForm
            summary={summaryQuery.data}
            calibrations={monitoringQuery.data.calibrations}
          />
        </>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44" />
            <Skeleton className="h-44" />
          </div>
          <Skeleton className="h-64" />
        </div>
      )}
    </div>
  );
}
