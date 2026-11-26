"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PREDICTION_HORIZONS } from "@/lib/constants";
import type {
  PredictionHorizon,
  VehiclePredictionSummary,
  VehicleType,
} from "@/lib/types";
import { cn, formatNumberID } from "@/lib/utils";

interface PredictionPanelProps {
  predictions: Record<VehicleType, VehiclePredictionSummary>;
}

export function PredictionPanel({ predictions }: PredictionPanelProps) {
  const [horizon, setHorizon] = useState<PredictionHorizon>(10);

  const items: Array<{ label: string; data: VehiclePredictionSummary }> = [
    { label: "Sepeda Motor", data: predictions.motor },
    { label: "Mobil", data: predictions.mobil },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Perkiraan Ketersediaan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Estimasi slot kosong untuk waktu tempuh 10 hingga 30 menit ke depan.
          </p>
        </div>

        <div
          className="inline-flex self-start rounded-xl bg-slate-100 p-1 sm:self-auto"
          role="tablist"
          aria-label="Pilih horizon prediksi"
        >
          {PREDICTION_HORIZONS.map((min) => {
            const active = horizon === min;
            return (
              <button
                key={min}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setHorizon(min)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                +{min} Menit
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
        {items.map(({ label, data }, idx) => {
          const h = data.horizons[horizon];

          return (
            <div
              key={data.vehicleType}
              className={cn(
                "py-3.5 first:pt-0 last:pb-0 md:py-0",
                idx === 0 ? "md:pr-6" : "md:pl-6",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {label}
                  </p>
                  <p className="text-xs text-slate-500">
                    Pukul {h.targetTimeLabel}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-3 tabular-nums">
                <div>
                  <span className="text-2xl font-bold text-slate-900">
                    ~{formatNumberID(h.predictedAvailable)}
                  </span>
                  <span className="ml-1.5 text-xs text-slate-500">
                    slot tersedia
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  ~{formatNumberID(h.predictedOccupied)} terisi ({h.predictedPct}
                  %)
                </span>
              </div>

              {h.estimatedMinutesToFull !== null && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {h.estimatedMinutesToFull === 0
                    ? "Diperkirakan mencapai kapasitas penuh."
                    : `Diperkirakan penuh dalam ±${h.estimatedMinutesToFull} menit.`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
