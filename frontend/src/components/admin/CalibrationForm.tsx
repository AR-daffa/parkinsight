"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { useSimulatorMutations } from "@/lib/hooks";
import type {
  CalibrationLogItem,
  DashboardSummaryResponse,
  VehicleType,
} from "@/lib/types";
import { formatNumberID } from "@/lib/utils";

interface CalibrationFormProps {
  summary: DashboardSummaryResponse;
  calibrations: CalibrationLogItem[];
}

export function CalibrationForm({
  summary,
  calibrations,
}: CalibrationFormProps) {
  const { calibrationMutation } = useSimulatorMutations();
  const [vehicleType, setVehicleType] = useState<VehicleType>("motor");
  const [newOccupancy, setNewOccupancy] = useState<string>(
    String(summary.vehicles.motor.occupied),
  );
  const [reason, setReason] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const currentVehicle = summary.vehicles[vehicleType];

  const handleVehicleChange = (nextType: VehicleType) => {
    setVehicleType(nextType);
    setNewOccupancy(String(summary.vehicles[nextType].occupied));
    setSavedMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    await calibrationMutation.mutateAsync({
      vehicleType,
      newOccupancy: Number(newOccupancy),
      reason: reason.trim() || "Penyesuaian hitung manual lapangan",
    });
    setReason("");
    setSavedMsg("Okupansi berhasil dikalibrasi dan dicatat ke audit log.");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Kalibrasi Okupansi Manual
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Gunakan saat jumlah kendaraan fisik berbeda dengan hitungan sistem.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Jenis Kendaraan
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["motor", "mobil"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleVehicleChange(type)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold capitalize ${
                    vehicleType === type
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {type} (Saat ini:{" "}
                  {formatNumberID(summary.vehicles[type].occupied)})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="cal-count"
              className="block text-xs font-semibold text-slate-700"
            >
              Jumlah Terparkir Aktual (Maks{" "}
              {formatNumberID(currentVehicle.capacity)})
            </label>
            <input
              id="cal-count"
              type="number"
              min={0}
              max={currentVehicle.capacity}
              value={newOccupancy}
              onChange={(e) => setNewOccupancy(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="cal-reason"
              className="block text-xs font-semibold text-slate-700"
            >
              Alasan Kalibrasi
            </label>
            <input
              id="cal-reason"
              type="text"
              placeholder="Contoh: Pengecekan fisik gerbang pagi"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {savedMsg && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              {savedMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={calibrationMutation.isPending}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {calibrationMutation.isPending
              ? "Menyimpan..."
              : "Simpan Kalibrasi"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Riwayat Kalibrasi (Audit Log)
        </h2>
        <div className="mt-4 space-y-2.5">
          {calibrations.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="capitalize">
                  {item.vehicleType}: {formatNumberID(item.previousOccupancy)} →{" "}
                  {formatNumberID(item.calibratedOccupancy)}
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  {item.createdAtLabel}
                </span>
              </div>
              <p className="mt-1 text-slate-600">{item.reason}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Oleh: {item.adminName}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
