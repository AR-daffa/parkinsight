"use client";

import { Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SCENARIO_LABELS } from "@/lib/constants";
import { useSimulatorMutations } from "@/lib/hooks";
import type {
  AdminMonitoringResponse,
  SimulationScenario,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function SimulatorControl({
  monitoring,
}: {
  monitoring: AdminMonitoringResponse;
}) {
  const { playbackMutation, scenarioMutation } = useSimulatorMutations();

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Kontrol Simulator Pengganti IoT
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Simulasikan aliran masuk/keluar kendaraan dan uji berbagai kondisi
            lapangan sebelum sensor fisik terpasang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              playbackMutation.mutate({
                running: !monitoring.simulatorRunning,
              })
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white",
              monitoring.simulatorRunning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            )}
          >
            {monitoring.simulatorRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Jeda Auto-Tick
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Jalankan Auto-Tick
              </>
            )}
          </button>

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {([1, 10, 60] as const).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() =>
                  playbackMutation.mutate({ running: true, speed: spd })
                }
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  monitoring.simulatorSpeed === spd
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600",
                )}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(SCENARIO_LABELS) as SimulationScenario[]).map((key) => {
          const item = SCENARIO_LABELS[key];
          const active = monitoring.activeScenario === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => scenarioMutation.mutate(key)}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-blue-600 bg-blue-50/70 ring-1 ring-blue-600/20"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <p className="text-xs font-bold text-slate-900">{item.label}</p>
              <p className="mt-1 text-[11px] text-slate-600">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
