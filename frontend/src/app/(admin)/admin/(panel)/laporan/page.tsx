"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useShiftReports } from "@/lib/hooks";
import type { ShiftReportRow, VehicleType } from "@/lib/types";
import { formatNumberID } from "@/lib/utils";

function exportCsv(rows: ShiftReportRow[]) {
  const header = [
    "Tanggal",
    "Shift",
    "Kendaraan",
    "Total Masuk",
    "Total Keluar",
    "Okupansi Puncak",
    "Jam Puncak",
  ];
  const lines = rows.map((r) => [
    r.date,
    r.shift,
    r.vehicleType,
    String(r.totalIn),
    String(r.totalOut),
    String(r.peakOccupancy),
    r.peakTimeLabel,
  ]);
  const csv = [header, ...lines].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rekap-parkinsight-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminLaporanPage() {
  const [filterType, setFilterType] = useState<VehicleType | "all">("all");
  const query = useShiftReports(filterType);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Rekap & Laporan Shift
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Ringkasan arus kendaraan masuk, keluar, dan puncak okupansi harian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as VehicleType | "all")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">Semua Kendaraan</option>
            <option value="motor">Sepeda Motor</option>
            <option value="mobil">Mobil</option>
          </select>

          <button
            type="button"
            disabled={!query.data?.length}
            onClick={() => query.data && exportCsv(query.data)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh CSV
          </button>
        </div>
      </div>

      <Card>
        {query.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 font-medium">Tanggal</th>
                  <th className="py-2.5 font-medium">Shift</th>
                  <th className="py-2.5 font-medium">Kendaraan</th>
                  <th className="py-2.5 text-right font-medium">Masuk</th>
                  <th className="py-2.5 text-right font-medium">Keluar</th>
                  <th className="py-2.5 text-right font-medium">Puncak</th>
                  <th className="py-2.5 text-right font-medium">Jam Puncak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.map((row, idx) => (
                  <tr key={`${row.shift}-${row.vehicleType}-${idx}`}>
                    <td className="py-3 tabular-nums text-slate-600">
                      {row.date}
                    </td>
                    <td className="py-3 font-medium text-slate-900">
                      {row.shift}
                    </td>
                    <td className="py-3 capitalize text-slate-700">
                      {row.vehicleType}
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums text-emerald-700">
                      +{formatNumberID(row.totalIn)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      -{formatNumberID(row.totalOut)}
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums text-slate-900">
                      {formatNumberID(row.peakOccupancy)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      {row.peakTimeLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Skeleton className="h-48" />
        )}
      </Card>
    </div>
  );
}
