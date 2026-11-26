import { Card } from "@/components/ui/Card";
import type { AnomalyLogItem, LiveEventItem } from "@/lib/types";

export function AnomalyTable({
  anomalies,
  recentEvents,
}: {
  anomalies: AnomalyLogItem[];
  recentEvents: LiveEventItem[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Log Anomali Batas [0, Kapasitas]
        </h2>
        <div className="mt-3 space-y-2.5">
          {anomalies.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-amber-950">
                <span className="capitalize">
                  {item.vehicleType} • Mentah: {item.rawCalculatedValue} →
                  Dibatasi: {item.clampedValue}
                </span>
                <span className="text-[11px] font-normal">
                  {item.intervalLabel}
                </span>
              </div>
              <p className="mt-1 text-amber-900">{item.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Aliran Event Kendaraan Terbaru
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2">Waktu</th>
                <th className="py-2">Gerbang</th>
                <th className="py-2">Arah</th>
                <th className="py-2">Sumber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvents.map((evt) => (
                <tr key={evt.id}>
                  <td className="py-2 tabular-nums text-slate-600">
                    {evt.timestampLabel}
                  </td>
                  <td className="py-2 font-medium text-slate-900">
                    {evt.gateName}
                  </td>
                  <td className="py-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        evt.direction === "IN"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {evt.direction}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500">{evt.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
