import { DEFAULT_THRESHOLDS } from "./constants";
import type { ParkingStatusKey, StatusThresholdConfig } from "./types";

/** Menggabungkan kelas CSS kondisional dengan aman tanpa library tambahan. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Menghitung metrik okupansi dari satu sumber kebenaran agar nilai
 * terisi, slot tersedia, dan persentase selalu sinkron.
 */
export function calculateOccupancyMetrics(
  occupiedRaw: number,
  capacity: number,
  thresholds: StatusThresholdConfig = DEFAULT_THRESHOLDS,
) {
  const safeCapacity = Math.max(1, capacity);
  const occupied = Math.min(safeCapacity, Math.max(0, Math.round(occupiedRaw)));
  const available = safeCapacity - occupied;
  const occupiedPct = Math.round((occupied / safeCapacity) * 100);
  const availablePct = 100 - occupiedPct;
  const status = getParkingStatus(occupiedPct, thresholds);

  return {
    capacity: safeCapacity,
    occupied,
    available,
    occupiedPct,
    availablePct,
    status,
  };
}

export function getParkingStatus(
  occupiedPct: number,
  thresholds: StatusThresholdConfig = DEFAULT_THRESHOLDS,
): ParkingStatusKey {
  if (occupiedPct >= 100) return "penuh";
  if (occupiedPct >= thresholds.criticalPct) return "hampir_penuh";
  if (occupiedPct >= thresholds.warningPct) return "waspada";
  return "tersedia";
}

export function formatNumberID(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Format waktu ke zona Asia/Jakarta (WIB) untuk konsistensi lintas perangkat. */
export function formatTimeWIB(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  })
    .format(date)
    .replace(".", ":");
}

export function formatDateLongWIB(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export function getTodayIsoWIB(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
