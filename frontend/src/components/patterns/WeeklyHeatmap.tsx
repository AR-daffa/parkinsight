"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { HeatmapCell, VehicleType } from "@/lib/types";
import { cn, formatNumberID, getParkingStatus } from "@/lib/utils";

function getHeatColor(pct: number): string {
  if (pct >= 85) {
    return "bg-blue-700 text-white hover:bg-blue-800";
  }
  if (pct >= 70) {
    return "bg-blue-500 text-white hover:bg-blue-600";
  }
  if (pct >= 45) {
    return "bg-blue-200 text-blue-950 hover:bg-blue-300";
  }
  if (pct >= 20) {
    return "bg-blue-100/80 text-blue-900 hover:bg-blue-200/80";
  }
  return "bg-slate-100 text-slate-600 hover:bg-slate-200/80";
}

function getSlotSummaryNote(pct: number, vehicleType: VehicleType): string {
  if (pct >= 85) {
    return vehicleType === "mobil"
      ? "Jam puncak parkir Mobil. Kapasitas 50 slot umumnya cepat penuh pada jam ini; siapkan opsi area parkir Perpustakaan Utama."
      : "Jam puncak kedatangan kuliah. Disarankan tiba 20–30 menit lebih awal agar mendapat ruang parkir dengan mudah.";
  }
  if (pct >= 70) {
    return "Arus kendaraan cukup ramai namun slot masih tersedia. Sebaiknya cek prediksi +10 menit di Beranda sebelum berangkat.";
  }
  return "Kondisi parkir relatif lengang pada jam ini. Waktu yang nyaman untuk masuk maupun keluar area Triguna.";
}

export function WeeklyHeatmap({
  cells,
  capacity,
  vehicleType,
}: {
  cells: HeatmapCell[];
  capacity: number;
  vehicleType: VehicleType;
}) {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    if (!selectedCell) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCell(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedCell]);

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const hours = Array.from(new Set(cells.map((c) => c.hour))).sort(
    (a, b) => a - b,
  );

  const cellMap = new Map<string, HeatmapCell>();
  for (const c of cells) {
    cellMap.set(`${c.dayIndex}-${c.hour}`, c);
  }

  const selectedAvailable = selectedCell
    ? Math.max(0, capacity - selectedCell.avgOccupiedCount)
    : 0;
  const selectedStatus = selectedCell
    ? getParkingStatus(selectedCell.avgOccupiedPct)
    : "tersedia";

  const estHourlyIn = selectedCell
    ? Math.max(
        1,
        Math.round(
          selectedCell.avgOccupiedCount *
            (selectedCell.hour <= 11 ? 0.22 : 0.09),
        ),
      )
    : 0;
  const estHourlyOut = selectedCell
    ? Math.max(
        1,
        Math.round(
          selectedCell.avgOccupiedCount *
            (selectedCell.hour >= 13 ? 0.24 : 0.08),
        ),
      )
    : 0;

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Peta Kepadatan Mingguan (06:00 – 22:00 WIB)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Klik pada kotak jam untuk melihat ringkasan rata-rata slot
              tersedia dan arus kendaraan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-slate-100 ring-1 ring-slate-200" />
              &lt; 20%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-blue-100" />
              20–44%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-blue-200" />
              45–69%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-blue-500" />
              70–84%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-xs bg-blue-700" />
              85–100%
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[76px_repeat(17,minmax(34px,1fr))] gap-1.5 text-center text-[11px] font-medium text-slate-400">
              <div className="text-left">Hari</div>
              {hours.map((h) => (
                <div key={h}>{String(h).padStart(2, "0")}:00</div>
              ))}
            </div>

            <div className="mt-2 space-y-1.5">
              {days.map((dayLabel, dayIndex) => (
                <div
                  key={dayLabel}
                  className="grid grid-cols-[76px_repeat(17,minmax(34px,1fr))] items-center gap-1.5"
                >
                  <span className="text-xs font-medium text-slate-700">
                    {dayLabel}
                  </span>
                  {hours.map((hour) => {
                    const cell = cellMap.get(`${dayIndex}-${hour}`);
                    const pct = cell?.avgOccupiedPct ?? 0;
                    const isSelected =
                      selectedCell?.dayIndex === dayIndex &&
                      selectedCell?.hour === hour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => cell && setSelectedCell(cell)}
                        className={cn(
                          "flex h-9 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-all cursor-pointer",
                          getHeatColor(pct),
                          isSelected && "ring-2 ring-slate-900 ring-offset-1",
                        )}
                      >
                        {pct}%
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Pop-up Ringkasan Detail Jam */}
      {selectedCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="heatmap-modal-title"
        >
          <button
            type="button"
            aria-label="Tutup pop-up"
            onClick={() => setSelectedCell(null)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Ringkasan Historis •{" "}
                  {vehicleType === "motor" ? "Sepeda Motor" : "Mobil"}
                </p>
                <h3
                  id="heatmap-modal-title"
                  className="mt-0.5 text-lg font-bold text-slate-900"
                >
                  {selectedCell.dayLabel},{" "}
                  {String(selectedCell.hour).padStart(2, "0")}:00 –{" "}
                  {String(selectedCell.hour + 1).padStart(2, "0")}:00 WIB
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-y border-slate-100 py-3">
              <span className="text-xs text-slate-500">
                Status Rata-Rata Jam Ini
              </span>
              <StatusBadge status={selectedStatus} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 tabular-nums">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">Rata-rata Slot Kosong</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ~{formatNumberID(selectedAvailable)}
                </p>
                <p className="text-[11px] text-slate-400">
                  dari {formatNumberID(capacity)} kapasitas
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">Rata-rata Terparkir</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ~{formatNumberID(selectedCell.avgOccupiedCount)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedCell.avgOccupiedPct}% keterisian
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">Estimasi Kendaraan Masuk</p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  +{formatNumberID(estHourlyIn)} kendaraan/jam
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="text-xs text-slate-500">
                  Estimasi Kendaraan Keluar
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  -{formatNumberID(estHourlyOut)} kendaraan/jam
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-xl bg-blue-50/70 px-3.5 py-3 text-xs leading-relaxed text-slate-700">
              {getSlotSummaryNote(selectedCell.avgOccupiedPct, vehicleType)}
            </p>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
