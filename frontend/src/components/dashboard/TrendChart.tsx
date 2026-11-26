"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type {
  DashboardTrendsResponse,
  TrendPoint,
  VehicleType,
} from "@/lib/types";
import { cn, formatNumberID } from "@/lib/utils";

interface SingleVehicleChartProps {
  title: string;
  colorHex: string;
  points: TrendPoint[];
}

function SingleVehicleChart({
  title,
  colorHex,
  points,
}: SingleVehicleChartProps) {
  const capacity = points[0]?.capacity ?? 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3"
              style={{ backgroundColor: colorHex }}
            />
            Aktual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3 border-t-2 border-dashed"
              style={{ borderColor: colorHex }}
            />
            Prediksi
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, Math.ceil(capacity * 1.05)]}
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
                fontSize: "12px",
              }}
              formatter={(value, name) => {
                const label =
                  name === "actualOccupied" ? "Aktual" : "Prediksi";
                return [`${formatNumberID(Number(value ?? 0))} kendaraan`, label];
              }}
            />
            <ReferenceLine
              y={capacity}
              stroke="#fda4af"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="actualOccupied"
              stroke={colorHex}
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="predictedOccupied"
              stroke={colorHex}
              strokeWidth={2.25}
              strokeDasharray="5 4"
              dot={{ r: 2.5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrendChart({ trends }: { trends: DashboardTrendsResponse }) {
  const [mobileTab, setMobileTab] = useState<VehicleType>("motor");

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Tren Okupansi Hari Ini
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Pergerakan jumlah kendaraan terparkir sejak pukul 06:00 WIB.
          </p>
        </div>

        <div className="inline-flex self-start rounded-xl bg-slate-100 p-1 md:hidden">
          {(["motor", "mobil"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMobileTab(type)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                mobileTab === type
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 md:hidden">
        {mobileTab === "motor" ? (
          <SingleVehicleChart
            title="Sepeda Motor"
            colorHex="#059669"
            points={trends.motor}
          />
        ) : (
          <SingleVehicleChart
            title="Mobil"
            colorHex="#2563eb"
            points={trends.mobil}
          />
        )}
      </div>

      <div className="mt-5 hidden gap-8 md:grid md:grid-cols-2">
        <SingleVehicleChart
          title="Sepeda Motor"
          colorHex="#059669"
          points={trends.motor}
        />
        <SingleVehicleChart
          title="Mobil"
          colorHex="#2563eb"
          points={trends.mobil}
        />
      </div>
    </Card>
  );
}
