import { Card } from "@/components/ui/Card";
import type { PeakHoursSummaryData } from "@/lib/types";

export function PeakHoursCard({ summary }: { summary: PeakHoursSummaryData }) {
  return (
    <Card className="p-0">
      <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Rentang Jam Terpadat
          </p>
          <p className="mt-1.5 text-base font-bold text-slate-900">
            {summary.busiestWindow}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Rata-rata keterisian{" "}
            <span className="font-semibold text-slate-800">
              {summary.busiestAvgPct}%
            </span>
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Waktu Lebih Lengang
          </p>
          <p className="mt-1.5 text-base font-bold text-slate-900">
            {summary.quietestWindow}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Rata-rata keterisian{" "}
            <span className="font-semibold text-slate-800">
              {summary.quietestAvgPct}%
            </span>
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">
            Catatan Waktu Datang
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
            {summary.arrivalAdvice}
          </p>
        </div>
      </div>
    </Card>
  );
}
