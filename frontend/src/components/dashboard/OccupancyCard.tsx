import { Bike, Car } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { STATUS_META } from "@/lib/constants";
import type { VehicleOccupancySummary } from "@/lib/types";
import { cn, formatNumberID } from "@/lib/utils";

export function OccupancyCard({ data }: { data: VehicleOccupancySummary }) {
  const isMotor = data.vehicleType === "motor";
  const statusMeta = STATUS_META[data.status];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              isMotor
                ? "bg-emerald-50 text-emerald-600"
                : "bg-blue-50 text-blue-600",
            )}
          >
            {isMotor ? (
              <Bike className="h-5 w-5" />
            ) : (
              <Car className="h-5 w-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{data.label}</h2>
            <p className="text-xs text-slate-500">
              Kapasitas {formatNumberID(data.capacity)} slot
            </p>
          </div>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-4 tabular-nums">
        <div>
          <span className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {formatNumberID(data.available)}
          </span>
          <span className="ml-2 text-xs font-medium text-slate-500">
            slot tersedia
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {formatNumberID(data.occupied)} terisi ({data.occupiedPct}%)
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            statusMeta.barClass,
          )}
          style={{ width: `${Math.min(100, data.occupiedPct)}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 tabular-nums">
        <span>15 menit terakhir</span>
        <div className="flex items-center gap-3 font-medium">
          <span className="text-emerald-700">
            +{formatNumberID(data.flow15mIn)} masuk
          </span>
          <span className="text-slate-600">
            -{formatNumberID(data.flow15mOut)} keluar
          </span>
        </div>
      </div>
    </Card>
  );
}
