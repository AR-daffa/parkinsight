import type {
  ParkingStatusKey,
  PredictionHorizon,
  SimulationScenario,
  StatusThresholdConfig,
  VehicleType,
} from "./types";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Interval polling dashboard otomatis dalam milidetik (PRD: 5-10 detik). */
export const DASHBOARD_POLL_INTERVAL_MS = 5_000;

export const OPERATIONAL_HOURS = {
  openHour: 6,
  closeHour: 22,
  label: "06:00 – 22:00 WIB",
} as const;

export const DEFAULT_CAPACITIES: Record<VehicleType, number> = {
  motor: 3000,
  mobil: 50,
};

export const DEFAULT_THRESHOLDS: StatusThresholdConfig = {
  warningPct: 70,
  criticalPct: 90,
};

export const PREDICTION_HORIZONS: PredictionHorizon[] = [10, 15, 30];

export const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Beranda", shortLabel: "Beranda" },
  { href: "/pola-parkir", label: "Pola Parkir", shortLabel: "Pola" },
  { href: "/panduan", label: "Panduan", shortLabel: "Panduan" },
  { href: "/tentang", label: "Tentang", shortLabel: "Tentang" },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview & Kalibrasi" },
  { href: "/admin/monitoring", label: "Monitoring & Simulator" },
  { href: "/admin/laporan", label: "Rekap & Laporan" },
] as const;

export const STATUS_META: Record<
  ParkingStatusKey,
  {
    label: string;
    badgeClass: string;
    barClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  tersedia: {
    label: "Tersedia",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    barClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-200",
  },
  waspada: {
    label: "Waspada",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    barClass: "bg-amber-500",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  hampir_penuh: {
    label: "Hampir Penuh",
    badgeClass: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    barClass: "bg-orange-500",
    textClass: "text-orange-700",
    borderClass: "border-orange-200",
  },
  penuh: {
    label: "Penuh",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
    barClass: "bg-rose-600",
    textClass: "text-rose-700",
    borderClass: "border-rose-200",
  },
};

export const SCENARIO_LABELS: Record<
  SimulationScenario,
  { label: string; description: string }
> = {
  live_normal: {
    label: "Normal Siang (Simulasi Live)",
    description: "Motor cukup ramai, mobil mulai waspada, sensor aktif.",
  },
  morning_rush: {
    label: "Jam Sibuk Pagi (08:30 WIB)",
    description: "Arus masuk tinggi, motor waspada dan mobil hampir penuh.",
  },
  car_almost_full: {
    label: "Mobil Penuh / Alternatif",
    description: "Slot mobil habis 100%, banner menyarankan area Perpustakaan.",
  },
  stale_sensor: {
    label: "Sensor Terlambat (> 10 Menit)",
    description: "Menguji tampilan banner peringatan data usang (TC-14).",
  },
  off_hours: {
    label: "Luar Jam Operasional",
    description: "Simulasi kondisi malam hari di luar layanan 06:00–22:00 WIB.",
  },
};
