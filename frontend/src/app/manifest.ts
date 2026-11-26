import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ParkInsight — Smart Parking Triguna",
    short_name: "ParkInsight",
    description:
      "Pemantauan ketersediaan dan prediksi okupansi parkir Lahan Parkir Triguna UIN Syarif Hidayatullah Jakarta.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    lang: "id",
  };
}
