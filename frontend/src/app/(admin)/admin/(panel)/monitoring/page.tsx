"use client";

import { AnomalyTable } from "@/components/admin/AnomalyTable";
import { SimulatorControl } from "@/components/admin/SimulatorControl";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminMonitoring } from "@/lib/hooks";

export default function AdminMonitoringPage() {
  const query = useAdminMonitoring();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Monitoring Perangkat & Skenario
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Status gerbang sensor, pengaturan skenario data, dan log anomali.
        </p>
      </div>

      {query.data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.devices.map((dev) => (
              <Card key={dev.deviceId}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {dev.gateName}
                    </p>
                    <p className="text-xs text-slate-400">{dev.deviceId}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      dev.status === "online"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {dev.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>Terakhir aktif: {dev.lastSeenLabel}</span>
                  <span className="font-medium text-slate-700 tabular-nums">
                    {dev.todayEvents} transaksi hari ini
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <SimulatorControl monitoring={query.data} />

          <AnomalyTable
            anomalies={query.data.anomalies}
            recentEvents={query.data.recentEvents}
          />
        </>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      )}
    </div>
  );
}
