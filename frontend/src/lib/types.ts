export type VehicleType = "motor" | "mobil";

export type PredictionHorizon = 10 | 15 | 30;

export type ParkingStatusKey =
  | "tersedia"
  | "waspada"
  | "hampir_penuh"
  | "penuh";

export type SimulationScenario =
  | "live_normal"
  | "morning_rush"
  | "car_almost_full"
  | "stale_sensor"
  | "off_hours";

export interface StatusThresholdConfig {
  warningPct: number;
  criticalPct: number;
}

export interface VehicleOccupancySummary {
  vehicleType: VehicleType;
  label: string;
  capacity: number;
  occupied: number;
  available: number;
  occupiedPct: number;
  availablePct: number;
  status: ParkingStatusKey;
  flow15mIn: number;
  flow15mOut: number;
}

export interface HorizonPrediction {
  horizonMinutes: PredictionHorizon;
  targetTimeLabel: string;
  predictedOccupied: number;
  predictedAvailable: number;
  predictedPct: number;
  status: ParkingStatusKey;
  estimatedMinutesToFull: number | null;
}

export interface VehiclePredictionSummary {
  vehicleType: VehicleType;
  modelName: string;
  horizons: Record<PredictionHorizon, HorizonPrediction>;
}

export interface DashboardRecommendation {
  level: "aman" | "perhatian" | "alternatif";
  headline: string;
  detail: string;
  alternativeSuggestion: string | null;
}

export interface DashboardSummaryResponse {
  lastUpdatedIso: string;
  lastUpdatedLabel: string;
  minutesSinceUpdate: number;
  isStale: boolean;
  isOffHours: boolean;
  isSimulation: boolean;
  activeScenario: SimulationScenario;
  recommendation: DashboardRecommendation;
  vehicles: Record<VehicleType, VehicleOccupancySummary>;
  predictions: Record<VehicleType, VehiclePredictionSummary>;
}

export interface TrendPoint {
  timeLabel: string;
  capacity: number;
  actualOccupied: number | null;
  predictedOccupied: number | null;
  isCurrentMarker?: boolean;
}

export interface DashboardTrendsResponse {
  date: string;
  motor: TrendPoint[];
  mobil: TrendPoint[];
}

export interface HeatmapCell {
  dayIndex: number; // 0 = Senin .. 5 = Sabtu
  dayLabel: string;
  hour: number; // 6 .. 22
  hourLabel: string;
  avgOccupiedPct: number;
  avgOccupiedCount: number;
}

export interface PeakHoursSummaryData {
  busiestWindow: string;
  busiestAvgPct: number;
  quietestWindow: string;
  quietestAvgPct: number;
  todayVsHistoricalPct: number;
  arrivalAdvice: string;
}

export interface ParkingPatternsResponse {
  vehicleType: VehicleType;
  capacity: number;
  heatmap: HeatmapCell[];
  summary: PeakHoursSummaryData;
}

export interface CalibrationLogItem {
  id: string;
  createdAtLabel: string;
  vehicleType: VehicleType;
  previousOccupancy: number;
  calibratedOccupancy: number;
  reason: string;
  adminName: string;
}

export interface DeviceStatusItem {
  deviceId: string;
  gateName: string;
  vehicleType: VehicleType;
  status: "online" | "offline";
  lastSeenLabel: string;
  todayEvents: number;
}

export interface AnomalyLogItem {
  id: string;
  intervalLabel: string;
  vehicleType: VehicleType;
  rawCalculatedValue: number;
  clampedValue: number;
  note: string;
}

export interface LiveEventItem {
  id: string;
  timestampLabel: string;
  gateName: string;
  vehicleType: VehicleType;
  direction: "IN" | "OUT";
  source: "ESP32" | "SIMULATOR";
}

export interface AdminMonitoringResponse {
  simulatorRunning: boolean;
  simulatorSpeed: 1 | 10 | 60;
  activeScenario: SimulationScenario;
  devices: DeviceStatusItem[];
  anomalies: AnomalyLogItem[];
  recentEvents: LiveEventItem[];
  calibrations: CalibrationLogItem[];
  configs: Record<
    VehicleType,
    { capacity: number; warningPct: number; criticalPct: number }
  >;
}

export interface ShiftReportRow {
  date: string;
  shift: "Pagi (06:00–14:00)" | "Sore (14:00–22:00)";
  vehicleType: VehicleType;
  totalIn: number;
  totalOut: number;
  peakOccupancy: number;
  peakTimeLabel: string;
}
