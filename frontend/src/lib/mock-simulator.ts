import {
  DEFAULT_CAPACITIES,
  DEFAULT_THRESHOLDS,
  OPERATIONAL_HOURS,
} from "./constants";
import type {
  AdminMonitoringResponse,
  AnomalyLogItem,
  CalibrationLogItem,
  DashboardRecommendation,
  DashboardSummaryResponse,
  DashboardTrendsResponse,
  HeatmapCell,
  HorizonPrediction,
  LiveEventItem,
  ParkingPatternsResponse,
  PredictionHorizon,
  ShiftReportRow,
  SimulationScenario,
  StatusThresholdConfig,
  TrendPoint,
  VehicleOccupancySummary,
  VehiclePredictionSummary,
  VehicleType,
} from "./types";
import {
  calculateOccupancyMetrics,
  formatTimeWIB,
  getTodayIsoWIB,
} from "./utils";

interface SimulatorState {
  scenario: SimulationScenario;
  simulatorRunning: boolean;
  simulatorSpeed: 1 | 10 | 60;
  motorOccupied: number;
  mobilOccupied: number;
  motorFlowIn: number;
  motorFlowOut: number;
  mobilFlowIn: number;
  mobilFlowOut: number;
  configs: Record<
    VehicleType,
    { capacity: number; warningPct: number; criticalPct: number }
  >;
  calibrations: CalibrationLogItem[];
  tickCount: number;
}

const STORAGE_KEY = "parkinsight_sim_state_v2";

const SCENARIO_PRESETS: Record<
  SimulationScenario,
  Pick<
    SimulatorState,
    | "motorOccupied"
    | "mobilOccupied"
    | "motorFlowIn"
    | "motorFlowOut"
    | "mobilFlowIn"
    | "mobilFlowOut"
  >
> = {
  live_normal: {
    motorOccupied: 1840,
    mobilOccupied: 36,
    motorFlowIn: 48,
    motorFlowOut: 22,
    mobilFlowIn: 4,
    mobilFlowOut: 2,
  },
  morning_rush: {
    motorOccupied: 2430,
    mobilOccupied: 46,
    motorFlowIn: 112,
    motorFlowOut: 14,
    mobilFlowIn: 7,
    mobilFlowOut: 1,
  },
  car_almost_full: {
    motorOccupied: 2740,
    mobilOccupied: 50,
    motorFlowIn: 65,
    motorFlowOut: 18,
    mobilFlowIn: 3,
    mobilFlowOut: 0,
  },
  stale_sensor: {
    motorOccupied: 1620,
    mobilOccupied: 31,
    motorFlowIn: 0,
    motorFlowOut: 0,
    mobilFlowIn: 0,
    mobilFlowOut: 0,
  },
  off_hours: {
    motorOccupied: 18,
    mobilOccupied: 1,
    motorFlowIn: 0,
    motorFlowOut: 3,
    mobilFlowIn: 0,
    mobilFlowOut: 1,
  },
};

function createInitialState(): SimulatorState {
  return {
    scenario: "live_normal",
    simulatorRunning: true,
    simulatorSpeed: 1,
    ...SCENARIO_PRESETS.live_normal,
    configs: {
      motor: {
        capacity: DEFAULT_CAPACITIES.motor,
        ...DEFAULT_THRESHOLDS,
      },
      mobil: {
        capacity: DEFAULT_CAPACITIES.mobil,
        ...DEFAULT_THRESHOLDS,
      },
    },
    calibrations: [
      {
        id: "cal-1",
        createdAtLabel: "Hari ini, 07:15 WIB",
        vehicleType: "mobil",
        previousOccupancy: 28,
        calibratedOccupancy: 24,
        reason: "Koreksi hitung manual petugas gerbang pagi",
        adminName: "Pak Sabeni",
      },
    ],
    tickCount: 0,
  };
}

let memoryState: SimulatorState = createInitialState();

function loadState(): SimulatorState {
  if (typeof window === "undefined") return memoryState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw) as Partial<SimulatorState>;
    memoryState = { ...createInitialState(), ...parsed };
  } catch {
    // Abaikan jika storage tidak tersedia
  }
  return memoryState;
}

function saveState(next: SimulatorState): SimulatorState {
  memoryState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Abaikan jika quota storage penuh
    }
  }
  return memoryState;
}

/** Menggeser angka okupansi secara halus setiap polling bila simulator aktif. */
function advanceTick(state: SimulatorState): SimulatorState {
  if (
    !state.simulatorRunning ||
    state.scenario === "stale_sensor" ||
    state.scenario === "off_hours"
  ) {
    return state;
  }

  const nextTick = state.tickCount + 1;
  const motorDelta = ((nextTick % 5) - 2) * (state.simulatorSpeed >= 10 ? 12 : 4);
  const mobilDelta = nextTick % 3 === 0 ? 1 : nextTick % 4 === 0 ? -1 : 0;

  return saveState({
    ...state,
    tickCount: nextTick,
    motorOccupied: Math.min(
      state.configs.motor.capacity,
      Math.max(0, state.motorOccupied + motorDelta),
    ),
    mobilOccupied: Math.min(
      state.configs.mobil.capacity,
      Math.max(0, state.mobilOccupied + mobilDelta),
    ),
    motorFlowIn: Math.max(8, state.motorFlowIn + (motorDelta > 0 ? 3 : -1)),
    motorFlowOut: Math.max(4, state.motorFlowOut + (motorDelta < 0 ? 3 : 1)),
  });
}

function buildVehicleSummary(
  vehicleType: VehicleType,
  occupiedRaw: number,
  capacity: number,
  thresholds: StatusThresholdConfig,
  flow15mIn: number,
  flow15mOut: number,
): VehicleOccupancySummary {
  const metrics = calculateOccupancyMetrics(occupiedRaw, capacity, thresholds);
  return {
    vehicleType,
    label: vehicleType === "motor" ? "Sepeda Motor" : "Mobil",
    ...metrics,
    flow15mIn,
    flow15mOut,
  };
}

function buildPredictions(
  summary: VehicleOccupancySummary,
  thresholds: StatusThresholdConfig,
  isOffHours: boolean,
): VehiclePredictionSummary {
  const netFlowPer15m = summary.flow15mIn - summary.flow15mOut;
  const ratePerMin = isOffHours ? -0.3 : netFlowPer15m / 15;
  const now = new Date();

  const makeHorizon = (minutes: PredictionHorizon): HorizonPrediction => {
    const projectedRaw = summary.occupied + ratePerMin * minutes;
    const metrics = calculateOccupancyMetrics(
      projectedRaw,
      summary.capacity,
      thresholds,
    );
    const targetDate = new Date(now.getTime() + minutes * 60_000);

    let estimatedMinutesToFull: number | null = null;
    if (summary.available === 0) {
      estimatedMinutesToFull = 0;
    } else if (ratePerMin > 0.15) {
      const mins = Math.round(summary.available / ratePerMin);
      if (mins <= 120) estimatedMinutesToFull = mins;
    }

    return {
      horizonMinutes: minutes,
      targetTimeLabel: `${formatTimeWIB(targetDate)} WIB`,
      predictedOccupied: metrics.occupied,
      predictedAvailable: metrics.available,
      predictedPct: metrics.occupiedPct,
      status: metrics.status,
      estimatedMinutesToFull,
    };
  };

  return {
    vehicleType: summary.vehicleType,
    modelName: "Random Forest Regression (Simulasi)",
    horizons: {
      10: makeHorizon(10),
      15: makeHorizon(15),
      30: makeHorizon(30),
    },
  };
}

function buildRecommendation(
  motor: VehicleOccupancySummary,
  mobil: VehicleOccupancySummary,
  isStale: boolean,
  isOffHours: boolean,
): DashboardRecommendation {
  if (isOffHours) {
    return {
      level: "perhatian",
      headline: "Di luar jam operasional utama (06:00–22:00 WIB)",
      detail:
        "Layanan parkir reguler Triguna sedang tutup. Angka menampilkan kendaraan tersisa di area.",
      alternativeSuggestion: null,
    };
  }

  if (isStale) {
    return {
      level: "perhatian",
      headline: "Pembaruan sensor tertunda sementara",
      detail:
        "Data belum menerima event baru lebih dari 10 menit. Gunakan angka sebagai estimasi sementara.",
      alternativeSuggestion: null,
    };
  }

  if (mobil.status === "penuh" || mobil.status === "hampir_penuh") {
    return {
      level: "alternatif",
      headline:
        mobil.status === "penuh"
          ? "Slot Mobil penuh — langsung menuju area alternatif"
          : `Slot Mobil menipis (${mobil.available} slot tersisa)`,
      detail:
        motor.status === "tersedia"
          ? `Parkir Motor masih longgar (${motor.available.toLocaleString("id-ID")} slot tersedia).`
          : `Parkir Motor juga padat (${motor.occupiedPct}% terisi), harap datang lebih awal.`,
      alternativeSuggestion:
        "Disarankan mengarahkan mobil ke area parkir Perpustakaan Utama UIN Jakarta.",
    };
  }

  if (motor.status === "waspada" || mobil.status === "waspada") {
    return {
      level: "perhatian",
      headline: "Kepadatan meningkat pada jam perkuliahan",
      detail: `Tersedia ${motor.available.toLocaleString("id-ID")} slot Motor dan ${mobil.available} slot Mobil. Pantau prediksi +10 menit sebelum tiba.`,
      alternativeSuggestion: null,
    };
  }

  return {
    level: "aman",
    headline: "Area Parkir Triguna terpantau aman & tersedia",
    detail: `Tersedia ${motor.available.toLocaleString("id-ID")} slot Motor dan ${mobil.available} slot Mobil untuk 30 menit ke depan.`,
    alternativeSuggestion: null,
  };
}

export function getSimulatedSummary(advance = true): DashboardSummaryResponse {
  const raw = loadState();
  const state = advance ? advanceTick(raw) : raw;

  const isStale = state.scenario === "stale_sensor";
  const isOffHours = state.scenario === "off_hours";
  const minutesSinceUpdate = isStale ? 14 : 0;
  const updateDate = new Date(Date.now() - minutesSinceUpdate * 60_000);

  const motor = buildVehicleSummary(
    "motor",
    state.motorOccupied,
    state.configs.motor.capacity,
    state.configs.motor,
    state.motorFlowIn,
    state.motorFlowOut,
  );
  const mobil = buildVehicleSummary(
    "mobil",
    state.mobilOccupied,
    state.configs.mobil.capacity,
    state.configs.mobil,
    state.mobilFlowIn,
    state.mobilFlowOut,
  );

  return {
    lastUpdatedIso: updateDate.toISOString(),
    lastUpdatedLabel: `${formatTimeWIB(updateDate)} WIB`,
    minutesSinceUpdate,
    isStale,
    isOffHours,
    isSimulation: true,
    activeScenario: state.scenario,
    recommendation: buildRecommendation(motor, mobil, isStale, isOffHours),
    vehicles: { motor, mobil },
    predictions: {
      motor: buildPredictions(motor, state.configs.motor, isOffHours),
      mobil: buildPredictions(mobil, state.configs.mobil, isOffHours),
    },
  };
}

export function getSimulatedTrends(date?: string): DashboardTrendsResponse {
  const state = loadState();
  const activeDate = date ?? getTodayIsoWIB();

  const hours = [
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "14:10",
    "14:15",
    "14:30",
  ];

  const motorCurve = [0.05, 0.28, 0.72, 0.86, 0.88, 0.78, 0.65, 0.61];
  const mobilCurve = [0.06, 0.34, 0.76, 0.88, 0.9, 0.82, 0.7, 0.72];

  const buildSeries = (
    vehicleType: VehicleType,
    curve: number[],
    currentOccupied: number,
  ): TrendPoint[] => {
    const cap = state.configs[vehicleType].capacity;
    const summary = getSimulatedSummary(false);
    const pred = summary.predictions[vehicleType].horizons;

    return hours.map((timeLabel, index) => {
      if (index < curve.length) {
        return {
          timeLabel,
          capacity: cap,
          actualOccupied: Math.round(cap * curve[index]),
          predictedOccupied: null,
        };
      }
      if (index === 8) {
        return {
          timeLabel: "Sekarang",
          capacity: cap,
          actualOccupied: currentOccupied,
          predictedOccupied: currentOccupied,
          isCurrentMarker: true,
        };
      }
      const horizonMap: Record<number, PredictionHorizon> = {
        9: 10,
        10: 15,
        11: 30,
      };
      const h = horizonMap[index];
      return {
        timeLabel: `+${h}m`,
        capacity: cap,
        actualOccupied: null,
        predictedOccupied: pred[h].predictedOccupied,
      };
    });
  };

  return {
    date: activeDate,
    motor: buildSeries("motor", motorCurve, state.motorOccupied),
    mobil: buildSeries("mobil", mobilCurve, state.mobilOccupied),
  };
}

export function getSimulatedPatterns(
  vehicleType: VehicleType,
): ParkingPatternsResponse {
  const state = loadState();
  const capacity = state.configs[vehicleType].capacity;
  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayFactor = [1.0, 0.98, 0.96, 0.92, 0.78, 0.35];

  const hourProfile: Record<number, number> = {
    6: 8,
    7: 34,
    8: 74,
    9: 89,
    10: 91,
    11: 83,
    12: 67,
    13: 69,
    14: 75,
    15: 62,
    16: 46,
    17: 30,
    18: 18,
    19: 12,
    20: 7,
    21: 4,
    22: 2,
  };

  const heatmap: HeatmapCell[] = [];
  for (let d = 0; d < days.length; d++) {
    for (
      let h = OPERATIONAL_HOURS.openHour;
      h <= OPERATIONAL_HOURS.closeHour;
      h++
    ) {
      const base = hourProfile[h] ?? 20;
      const pct = Math.min(
        100,
        Math.max(2, Math.round(base * dayFactor[d] + ((d + h) % 4))),
      );
      heatmap.push({
        dayIndex: d,
        dayLabel: days[d],
        hour: h,
        hourLabel: `${String(h).padStart(2, "0")}:00`,
        avgOccupiedPct: pct,
        avgOccupiedCount: Math.round((pct / 100) * capacity),
      });
    }
  }

  return {
    vehicleType,
    capacity,
    heatmap,
    summary:
      vehicleType === "motor"
        ? {
            busiestWindow: "09:00 – 11:00 WIB (Senin–Rabu)",
            busiestAvgPct: 89,
            quietestWindow: "Sebelum 07:30 WIB atau setelah 16:00 WIB",
            quietestAvgPct: 32,
            todayVsHistoricalPct: 4,
            arrivalAdvice:
              "Datang sebelum pukul 07:45 WIB memberi peluang tertinggi mendapat slot Motor dekat akses utama.",
          }
        : {
            busiestWindow: "08:30 – 11:30 WIB (Senin–Kamis)",
            busiestAvgPct: 92,
            quietestWindow: "06:00 – 07:15 WIB & 16:30 – 21:00 WIB",
            quietestAvgPct: 28,
            todayVsHistoricalPct: 6,
            arrivalAdvice:
              "Karena kapasitas Mobil hanya 50 slot, kedatangan pukul 08:30–11:00 berisiko tinggi penuh — siapkan alternatif Perpustakaan Utama.",
          },
  };
}

export function getSimulatedAdminMonitoring(): AdminMonitoringResponse {
  const state = loadState();
  const isStale = state.scenario === "stale_sensor";
  const nowLabel = `${formatTimeWIB(new Date())} WIB`;

  const anomalies: AnomalyLogItem[] = [
    {
      id: "anom-1",
      intervalLabel: "Hari ini, 06:05 WIB",
      vehicleType: "mobil",
      rawCalculatedValue: -1,
      clampedValue: 0,
      note: "Nilai negatif dibatasi otomatis ke 0 (kendaraan bermalam keluar)",
    },
    {
      id: "anom-2",
      intervalLabel: "Kemarin, 10:25 WIB",
      vehicleType: "mobil",
      rawCalculatedValue: 52,
      clampedValue: 50,
      note: "Melebihi kapasitas 50, dibatasi ke batas maksimal 50",
    },
  ];

  const recentEvents: LiveEventItem[] = [
    {
      id: "evt-105",
      timestampLabel: nowLabel,
      gateName: "Gerbang Motor Triguna",
      vehicleType: "motor",
      direction: "IN",
      source: "SIMULATOR",
    },
    {
      id: "evt-104",
      timestampLabel: nowLabel,
      gateName: "Gerbang Mobil Triguna",
      vehicleType: "mobil",
      direction: "IN",
      source: "SIMULATOR",
    },
    {
      id: "evt-103",
      timestampLabel: nowLabel,
      gateName: "Gerbang Motor Triguna",
      vehicleType: "motor",
      direction: "OUT",
      source: "SIMULATOR",
    },
    {
      id: "evt-102",
      timestampLabel: nowLabel,
      gateName: "Gerbang Motor Triguna",
      vehicleType: "motor",
      direction: "IN",
      source: "SIMULATOR",
    },
  ];

  return {
    simulatorRunning: state.simulatorRunning,
    simulatorSpeed: state.simulatorSpeed,
    activeScenario: state.scenario,
    devices: [
      {
        deviceId: "esp32-motor-01",
        gateName: "Gerbang Motor Triguna",
        vehicleType: "motor",
        status: isStale ? "offline" : "online",
        lastSeenLabel: isStale ? "14 menit lalu" : "Baru saja",
        todayEvents: 2180 + state.tickCount * 3,
      },
      {
        deviceId: "esp32-mobil-01",
        gateName: "Gerbang Mobil Triguna",
        vehicleType: "mobil",
        status: isStale ? "offline" : "online",
        lastSeenLabel: isStale ? "14 menit lalu" : "Baru saja",
        todayEvents: 114 + state.tickCount,
      },
    ],
    anomalies,
    recentEvents,
    calibrations: state.calibrations,
    configs: state.configs,
  };
}

export function getSimulatedShiftReports(
  vehicleType?: VehicleType | "all",
): ShiftReportRow[] {
  const rows: ShiftReportRow[] = [
    {
      date: getTodayIsoWIB(),
      shift: "Pagi (06:00–14:00)",
      vehicleType: "motor",
      totalIn: 2640,
      totalOut: 820,
      peakOccupancy: 2430,
      peakTimeLabel: "10:15 WIB",
    },
    {
      date: getTodayIsoWIB(),
      shift: "Pagi (06:00–14:00)",
      vehicleType: "mobil",
      totalIn: 78,
      totalOut: 32,
      peakOccupancy: 48,
      peakTimeLabel: "09:45 WIB",
    },
    {
      date: getTodayIsoWIB(),
      shift: "Sore (14:00–22:00)",
      vehicleType: "motor",
      totalIn: 610,
      totalOut: 2390,
      peakOccupancy: 1890,
      peakTimeLabel: "14:20 WIB",
    },
    {
      date: getTodayIsoWIB(),
      shift: "Sore (14:00–22:00)",
      vehicleType: "mobil",
      totalIn: 24,
      totalOut: 69,
      peakOccupancy: 46,
      peakTimeLabel: "14:10 WIB",
    },
  ];

  if (!vehicleType || vehicleType === "all") return rows;
  return rows.filter((r) => r.vehicleType === vehicleType);
}

export function setSimulationScenario(scenario: SimulationScenario) {
  const state = loadState();
  saveState({
    ...state,
    scenario,
    ...SCENARIO_PRESETS[scenario],
    tickCount: 0,
  });
}

export function toggleSimulatorRunning(running: boolean) {
  const state = loadState();
  saveState({ ...state, simulatorRunning: running });
}

export function setSimulatorSpeed(speed: 1 | 10 | 60) {
  const state = loadState();
  saveState({ ...state, simulatorSpeed: speed });
}

export function calibrateSimulatedOccupancy(
  vehicleType: VehicleType,
  newOccupancy: number,
  reason: string,
) {
  const state = loadState();
  const cap = state.configs[vehicleType].capacity;
  const clamped = Math.min(cap, Math.max(0, Math.round(newOccupancy)));
  const previous =
    vehicleType === "motor" ? state.motorOccupied : state.mobilOccupied;

  const entry: CalibrationLogItem = {
    id: `cal-${Date.now()}`,
    createdAtLabel: `Hari ini, ${formatTimeWIB(new Date())} WIB`,
    vehicleType,
    previousOccupancy: previous,
    calibratedOccupancy: clamped,
    reason,
    adminName: "Admin Pengelola",
  };

  saveState({
    ...state,
    motorOccupied: vehicleType === "motor" ? clamped : state.motorOccupied,
    mobilOccupied: vehicleType === "mobil" ? clamped : state.mobilOccupied,
    calibrations: [entry, ...state.calibrations].slice(0, 10),
  });
}

export function updateSimulatedConfig(
  vehicleType: VehicleType,
  capacity: number,
  warningPct: number,
  criticalPct: number,
) {
  const state = loadState();
  const safeCap = Math.max(1, Math.round(capacity));

  saveState({
    ...state,
    motorOccupied:
      vehicleType === "motor"
        ? Math.min(state.motorOccupied, safeCap)
        : state.motorOccupied,
    mobilOccupied:
      vehicleType === "mobil"
        ? Math.min(state.mobilOccupied, safeCap)
        : state.mobilOccupied,
    configs: {
      ...state.configs,
      [vehicleType]: {
        capacity: safeCap,
        warningPct,
        criticalPct,
      },
    },
  });
}
