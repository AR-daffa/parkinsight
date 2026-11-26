import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function PanduanPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Panduan & Informasi Parkir
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Keterangan indikator status kepadatan dan informasi operasional
          parkir Triguna.
        </p>
      </div>

      <Card>
        <h2 className="text-base font-bold text-slate-900">
          Indikator Status Kepadatan
        </h2>
        <div className="mt-4 divide-y divide-slate-100">
          <div className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status="tersedia" className="w-28 justify-center" />
              <span className="text-xs font-semibold text-slate-800">
                Keterisian di bawah 70%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Ruang parkir masih cukup longgar untuk kendaraan masuk normal.
            </p>
          </div>

          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status="waspada" className="w-28 justify-center" />
              <span className="text-xs font-semibold text-slate-800">
                Keterisian 70% – 89%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Mulai ramai pada jam pergantian kuliah; periksa estimasi +10 menit.
            </p>
          </div>

          <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge
                status="hampir_penuh"
                className="w-28 justify-center"
              />
              <span className="text-xs font-semibold text-slate-800">
                Keterisian 90% – 99%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Sisa slot terbatas, terutama untuk Mobil. Siapkan opsi parkir
              alternatif.
            </p>
          </div>

          <div className="flex flex-col gap-2 py-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <StatusBadge status="penuh" className="w-28 justify-center" />
              <span className="text-xs font-semibold text-slate-800">
                Keterisian 100%
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Kapasitas penuh. Disarankan langsung menuju lokasi parkir
              alternatif.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-base font-bold text-slate-900">
            Lokasi Alternatif Saat Penuh
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Apabila kapasitas Mobil (50 slot) atau Sepeda Motor (3.000 slot) di
            Lahan Parkir Triguna mencapai batas penuh pada jam sibuk pagi,
            pengendara dapat menggunakan area parkir sekitar{" "}
            <strong className="font-semibold text-slate-800">
              Perpustakaan Utama UIN Jakarta
            </strong>{" "}
            sesuai arahan petugas lapangan.
          </p>
        </Card>

        <Card>
          <h2 className="text-base font-bold text-slate-900">
            Catatan Pembacaan Data
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Angka ketersediaan dihitung dari selisih kapasitas maksimal dan
            akumulasi kendaraan masuk-keluar di gerbang. Angka pada bagian
            perkiraan (+10, +15, +30 menit) merupakan estimasi model statistik
            berdasarkan pola historis.
          </p>
        </Card>
      </div>
    </div>
  );
}
