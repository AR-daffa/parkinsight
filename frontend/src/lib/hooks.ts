"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAdminMonitoring,
  getDashboardSummary,
  getDashboardTrends,
  getParkingPatterns,
  getShiftReports,
  setSimulatorPlayback,
  submitCalibration,
  submitVehicleConfig,
  switchSimulationScenario,
} from "./api";
import { DASHBOARD_POLL_INTERVAL_MS } from "./constants";
import type { SimulationScenario, VehicleType } from "./types";

export const queryKeys = {
  summary: ["dashboard", "summary"] as const,
  trends: ["dashboard", "trends"] as const,
  patterns: (vehicleType: VehicleType) => ["patterns", vehicleType] as const,
  adminMonitoring: ["admin", "monitoring"] as const,
  shiftReports: (vehicleType: VehicleType | "all") =>
    ["admin", "reports", vehicleType] as const,
};

/**
 * Mengambil ringkasan okupansi & prediksi dengan auto-refresh tanpa kedip
 * berkat placeholderData: keepPreviousData.
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.summary,
    queryFn: getDashboardSummary,
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}

export function useDashboardTrends() {
  return useQuery({
    queryKey: queryKeys.trends,
    queryFn: () => getDashboardTrends(),
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}

export function useParkingPatterns(vehicleType: VehicleType) {
  return useQuery({
    queryKey: queryKeys.patterns(vehicleType),
    queryFn: () => getParkingPatterns(vehicleType),
    placeholderData: keepPreviousData,
  });
}

export function useAdminMonitoring() {
  return useQuery({
    queryKey: queryKeys.adminMonitoring,
    queryFn: getAdminMonitoring,
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
    placeholderData: keepPreviousData,
  });
}

export function useShiftReports(vehicleType: VehicleType | "all") {
  return useQuery({
    queryKey: queryKeys.shiftReports(vehicleType),
    queryFn: () => getShiftReports(vehicleType),
    placeholderData: keepPreviousData,
  });
}

export function useSimulatorMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries();
  };

  const scenarioMutation = useMutation({
    mutationFn: (scenario: SimulationScenario) =>
      switchSimulationScenario(scenario),
    onSuccess: invalidateAll,
  });

  const playbackMutation = useMutation({
    mutationFn: ({
      running,
      speed,
    }: {
      running: boolean;
      speed?: 1 | 10 | 60;
    }) => setSimulatorPlayback(running, speed),
    onSuccess: invalidateAll,
  });

  const calibrationMutation = useMutation({
    mutationFn: submitCalibration,
    onSuccess: invalidateAll,
  });

  const configMutation = useMutation({
    mutationFn: submitVehicleConfig,
    onSuccess: invalidateAll,
  });

  return {
    scenarioMutation,
    playbackMutation,
    calibrationMutation,
    configMutation,
  };
}
