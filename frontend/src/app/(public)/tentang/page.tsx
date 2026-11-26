import Image from "next/image";
import { Card } from "@/components/ui/Card";

const SYSTEM_SPECS = [
  { label: "Lokasi Objek", value: "Lahan Parkir Triguna, UIN Syarif Hidayatullah Jakarta" },
  { label: "Jam Operasional", value: "06:00 – 22:00 WIB (Senin – Sabtu)" },
  { label: "Kapasitas Sepeda Motor", value: "3.000 slot (jalur khusus motor)" },
  { label: "Kapasitas Mobil", value: "50 slot (jalur khusus mobil)" },
  { label: "Metode Prediksi", value: "Random Forest Regression (horizon +10, +15, +30 menit)" },
  { label: "Basis Data Historis", value: "475.355 catatan transaksi (Mei – Oktober 2026)" },
];

export default function TentangPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Tentang ParkInsight
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Informasi pengembangan sistem pemantauan dan prediksi parkir Triguna.
        </p>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-blue-600 shadow-xs">
          <Image
            src="/images/logo-parkinsight.jpeg"
            alt="Logo ParkInsight"
            fill
            sizes="64px"
            className="scale-[1.34] object-cover"
          />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ParkInsight — Smart Parking Monitoring System
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Dikembangkan sebagai proyek Capstone untuk membantu mahasiswa,
            dosen, dan tenaga kependidikan memeriksa ketersediaan ruang parkir
            di area Triguna sebelum tiba di kampus, sekaligus membantu pengelola
            memantau kepadatan harian secara terpadu.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Spesifikasi Operasional Sistem
        </h2>
        <dl className="mt-4 divide-y divide-slate-100 text-xs">
          {SYSTEM_SPECS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between"
            >
              <dt className="font-medium text-slate-500">{item.label}</dt>
              <dd className="font-semibold text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
