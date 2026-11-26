"use client";

import { useState } from "react";
import { PeakHoursCard } from "@/components/patterns/PeakHoursCard";
import { WeeklyHeatmap } from "@/components/patterns/WeeklyHeatmap";
import { Skeleton } from "@/components/ui/Skeleton";
import { useParkingPatterns } from "@/lib/hooks";
import type { VehicleType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PolaParkirPage() {
  const [vehicleType, setVehicleType] = useState<VehicleType>("motor");
  const query = useParkingPatterns(vehicleType);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pola Parkir Mingguan
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Rata-rata tingkat keterisian parkir per jam berdasarkan data
            historis.
          </p>
        </div>

        <div className="inline-flex self-start rounded-xl border border-slate-200/80 bg-white p-1 sm:self-auto">
          {(["motor", "mobil"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setVehicleType(type)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
                vehicleType === type
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              {type === "motor" ? "Sepeda Motor" : "Mobil"}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading && !query.data ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-80" />
        </div>
      ) : query.data ? (
        <>
          <PeakHoursCard summary={query.data.summary} />
          <WeeklyHeatmap
            cells={query.data.heatmap}
            capacity={query.data.capacity}
            vehicleType={vehicleType}
          />
        </>
      ) : null}
    </div>
  );
}
