import { API_BASE_URL, USE_MOCK_DATA } from "./constants";
import {
  calibrateSimulatedOccupancy,
  getSimulatedAdminMonitoring,
  getSimulatedPatterns,
  getSimulatedShiftReports,
  getSimulatedSummary,
  getSimulatedTrends,
  setSimulationScenario,
  setSimulatorSpeed,
  toggleSimulatorRunning,
  updateSimulatedConfig,
} from "./mock-simulator";
import type {
  AdminMonitoringResponse,
  DashboardSummaryResponse,
  DashboardTrendsResponse,
  ParkingPatternsResponse,
  ShiftReportRow,
  SimulationScenario,
  VehicleType,
} from "./types";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("parkinsight_admin_token")
      : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Permintaan API gagal (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  if (USE_MOCK_DATA) {
    return getSimulatedSummary(true);
  }
  return fetchJson<DashboardSummaryResponse>("/dashboard/summary");
}

export async function getDashboardTrends(
  date?: string,
): Promise<DashboardTrendsResponse> {
  if (USE_MOCK_DATA) {
    return getSimulatedTrends(date);
  }
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return fetchJson<DashboardTrendsResponse>(`/dashboard/trends${query}`);
}

export async function getParkingPatterns(
  vehicleType: VehicleType,
): Promise<ParkingPatternsResponse> {
  if (USE_MOCK_DATA) {
    return getSimulatedPatterns(vehicleType);
  }
  return fetchJson<ParkingPatternsResponse>(
    `/dashboard/patterns?vehicle_type=${vehicleType}`,
  );
}

export async function getAdminMonitoring(): Promise<AdminMonitoringResponse> {
  if (USE_MOCK_DATA) {
    return getSimulatedAdminMonitoring();
  }
  return fetchJson<AdminMonitoringResponse>("/admin/monitoring");
}

export async function getShiftReports(
  vehicleType: VehicleType | "all" = "all",
): Promise<ShiftReportRow[]> {
  if (USE_MOCK_DATA) {
    return getSimulatedShiftReports(vehicleType);
  }
  return fetchJson<ShiftReportRow[]>(
    `/admin/reports/summary?vehicle_type=${vehicleType}`,
  );
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<{ accessToken: string }> {
  if (USE_MOCK_DATA) {
    if (username.trim() === "admin" && password === "admin123") {
      const token = "mock-jwt-token-parkinsight";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("parkinsight_admin_token", token);
        window.dispatchEvent(new Event("parkinsight-auth-change"));
      }
      return { accessToken: token };
    }
    throw new Error("Username atau password yang dimasukkan tidak sesuai.");
  }

  const res = await fetchJson<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (typeof window !== "undefined") {
    window.localStorage.setItem("parkinsight_admin_token", res.access_token);
    window.dispatchEvent(new Event("parkinsight-auth-change"));
  }
  return { accessToken: res.access_token };
}

export async function submitCalibration(payload: {
  vehicleType: VehicleType;
  newOccupancy: number;
  reason: string;
}): Promise<void> {
  if (USE_MOCK_DATA) {
    calibrateSimulatedOccupancy(
      payload.vehicleType,
      payload.newOccupancy,
      payload.reason,
    );
    return;
  }
  await fetchJson("/admin/calibrate", {
    method: "POST",
    body: JSON.stringify({
      vehicle_type: payload.vehicleType,
      calibrated_occupancy: payload.newOccupancy,
      reason: payload.reason,
    }),
  });
}

export async function submitVehicleConfig(payload: {
  vehicleType: VehicleType;
  capacity: number;
  warningPct: number;
  criticalPct: number;
}): Promise<void> {
  if (USE_MOCK_DATA) {
    updateSimulatedConfig(
      payload.vehicleType,
      payload.capacity,
      payload.warningPct,
      payload.criticalPct,
    );
    return;
  }
  await fetchJson(`/admin/config/${payload.vehicleType}`, {
    method: "PUT",
    body: JSON.stringify({
      capacity: payload.capacity,
      warning_pct: payload.warningPct,
      critical_pct: payload.criticalPct,
    }),
  });
}

export async function switchSimulationScenario(scenario: SimulationScenario) {
  setSimulationScenario(scenario);
}

export async function setSimulatorPlayback(
  running: boolean,
  speed?: 1 | 10 | 60,
) {
  if (USE_MOCK_DATA) {
    toggleSimulatorRunning(running);
    if (speed) setSimulatorSpeed(speed);
    return;
  }
  await fetchJson(`/admin/simulator/${running ? "start" : "stop"}`, {
    method: "POST",
    body: JSON.stringify({ speed }),
  });
}
