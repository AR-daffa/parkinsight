# Product Requirements Document (PRD) — ParkInsight

**Nama Produk:** ParkInsight (*Smart Parking Monitoring & Occupancy Prediction System*)  
**Lokasi Objek:** Lahan Parkir Triguna, UIN Syarif Hidayatullah Jakarta  
**Versi Dokumen:** 1.0  
**Tanggal:** 18 November 2026  
**Referensi Utama:** [Proposal_Capstone_ParkInsight_Kelompok3_Revisi 2.0-3.pdf](./Proposal_Capstone_ParkInsight_Kelompok3_Revisi%202.0-3.pdf)  

---

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Latar Belakang Masalah
Berdasarkan observasi lapangan, wawancara pengelola (Bapak Sabeni, Bapak Sarwani, dan Bapak Deden), serta survei terhadap 38 responden valid mahasiswa pengguna kendaraan pribadi di Lahan Parkir Triguna UIN Syarif Hidayatullah Jakarta:
- Pencatatan kendaraan masuk/keluar sudah ada di sistem pengelola, tetapi **belum tersedia secara terbuka** bagi pengendara sebelum tiba di lokasi.
- Pengelola **belum memiliki dashboard pemantauan terpadu** untuk melihat okupansi real-time dan estimasi kepadatan ke depan guna mengantisipasi lonjakan (*over-capacity*).
- Pengguna membutuhkan informasi **ketersediaan slot secara real-time** (skor kepentingan 4,29/5) dan **prediksi jangka pendek** terutama **10 menit ke depan** (dipilih oleh 57,9% responden), serta opsi horizon 15 dan 30 menit.

### 1.2 Solusi yang Dikembangkan
**ParkInsight** adalah sistem *smart parking* berbasis web responsif yang menyajikan:
1. Pemantauan jumlah kendaraan terparkir, slot tersedia, dan persentase okupansi secara *near real-time* untuk **Sepeda Motor** dan **Mobil**.
2. Prediksi okupansi dan ketersediaan parkir jangka pendek (**10, 15, dan 30 menit ke depan**) menggunakan model **Random Forest Regression** yang dilatih dari data historis transaksi dan disuplai data arus kendaraan.
3. Panel operasional pengelola untuk kalibrasi okupansi, pemantauan anomali/perangkat, rekap data, dan simulasi aliran data IoT selama tahap *Web-First Development*.

### 1.3 Parameter Operasional Objek
- **Kapasitas Maksimal Sepeda Motor:** `3.000` slot (jalur terpisah).
- **Kapasitas Maksimal Mobil:** `50` slot (jalur terpisah).
- **Jam Operasional Utama:** `06:00 – 22:00 WIB` (16 jam/hari, zona waktu `Asia/Jakarta` / UTC+7).
- **Dataset Historis Tersedia:** `dataset/data_trans_6_bulan_terakhir.xlsx` (periode 1 Mei – 28 Oktober 2026; `475.355` transaksi bersih terdiri dari `422.920` motor dan `52.435` mobil).

---

## 2. Ruang Lingkup & Strategi Pengembangan (*Web-First*)

Sistem dikembangkan dengan strategi **Web-First** agar aplikasi web, basis data, backend API, dan integrasi Machine Learning dapat selesai dan diuji sebelum perangkat keras IoT fisik (ESP32 + Sensor IR) dipasang di gerbang Triguna.

### Dalam Ruang Lingkup (*In Scope*)
- Aplikasi Web Responsif (*Mobile-First*, Desktop & Mobile) dengan halaman publik (**Beranda**, **Pola Parkir**, **Panduan**, **Tentang**) dan halaman terproteksi (**Panel Admin**).
- Backend API & layanan agregasi data interval 5 menit serta worker MQTT.
- Pipeline *Offline Training* & *Online Inference* model Random Forest Regression (`rf_motor` dan `rf_car`).
- Simulator *Replay* IoT berbasis dataset historis untuk pengujian *end-to-end* tanpa hardware fisik.

### Di Luar Ruang Lingkup (*Out of Scope* untuk Rilis Web v1)
- Sistem pembayaran parkir, manajemen tiket/palang otomatis, atau pencatatan pelat nomor (ANPR).
- Pemantauan posisi slot per petak parkir individual (*slot-level parking sensor*).
- Aplikasi mobile native (Android/iOS), digantikan oleh desain web responsif.

---

## 3. Tech Stack & Arsitektur Sistem

### 3.1 Tech Stack yang Ditetapkan
| Lapisan | Teknologi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Web** | **Next.js (React) + TypeScript** | Mendukung tampilan web responsif desktop & mobile, struktur routing rapi, type-safety kontrak API, serta mudah di-deploy. |
| **Styling & UI** | **Tailwind CSS** + **Lucide Icons** | Implementasi cepat sesuai identitas visual ParkInsight (biru tua, putih, biru muda; pembeda hijau untuk motor & biru untuk mobil). |
| **Visualisasi & State** | **Recharts / Apache ECharts** + **TanStack Query** | Grafik interaktif (aktual solid, prediksi putus-putus, batas kapasitas) dan *auto-polling* berkala (5–10 detik). |
| **Backend API** | **Python 3.11+ & FastAPI** + **Pydantic v2** | Selaras dengan ekosistem ML Python, validasi skema ketat, performa tinggi, dan dokumentasi OpenAPI otomatis. |
| **ORM & Migrasi** | **SQLAlchemy 2.0 + Alembic** | Manajemen skema dan migrasi basis data PostgreSQL secara terstruktur. |
| **Scheduler & Worker** | **APScheduler** + **aiomqtt / paho-mqtt** | Menjalankan agregasi & inferensi ML tiap 5 menit serta menerima event MQTT secara asinkron. |
| **Database** | **PostgreSQL 16** | Menyimpan event mentah, agregasi okupansi 5 menit, fitur ML, hasil prediksi, konfigurasi, dan akun admin. |
| **Message Broker** | **Mosquitto MQTT** | Broker ringan untuk komunikasi node ESP32 via Wi-Fi 2,4 GHz. |
| **Machine Learning** | **scikit-learn (RandomForestRegressor)**, Pandas, NumPy, Joblib *(+ XGBoost untuk evaluasi komparatif)* | Sesuai metodologi KDD di proposal; model dilatih offline dan dimuat sekali (*in-memory*) saat startup backend. |
| **Dev & Container** | **Docker & Docker Compose** | Menyeragamkan environment PostgreSQL, Mosquitto, Backend, dan Frontend antar anggota tim. |

### 3.2 Pola Integrasi Web & Machine Learning
1. **Offline Training:** Dataset historis diagregasi per interval 5 menit → dibentuk fitur tanpa *data leakage* → dilatih model terpisah (`rf_motor.joblib` & `rf_car.joblib`) → dievaluasi (`MAE`, `RMSE`, `R²`, `MAPE` vs `Linear Regression` dan `XGBoost`) → disimpan beserta `model_metadata.json`.
2. **Online Ingestion:** Node IoT (atau IoT Simulator) mengirim event masuk/keluar ke Mosquitto MQTT atau `POST /api/v1/events` → divalidasi & dicek idempotensinya → disimpan ke `parking_events`.
3. **Scheduled 5-Minute Pipeline:** Setiap 5 menit, scheduler mengagregasi event baru ke tabel `occupancy` → menghitung vektor fitur terbaru ke `features` → menjalankan prediksi `t+10`, `t+15`, `t+30` menit → menyimpan hasil ke `prediction`.
4. **Dashboard Serving:** Frontend Next.js memanggil endpoint `GET` FastAPI yang membaca data siap saji dari PostgreSQL (tidak menjalankan training/inferensi langsung pada request user).

---

## 4. Aktor Sistem & Aktivitas

Sistem memiliki **2 aktor manusia utama** (*User* dan *Admin*), didukung oleh komponen eksternal *Node IoT/Simulator* sebagai sumber data otomatis.

### 4.1 Daftar Aktor
| Aktor | Kategori | Deskripsi | Autentikasi |
| :--- | :--- | :--- | :--- |
| **User (Pengguna Parkir)** | Aktor Publik | Mahasiswa, dosen, dan tenaga kependidikan yang mengakses informasi parkir Triguna sebelum atau saat menuju kampus. | Tidak perlu login |
| **Admin (Pengelola Parkir)** | Aktor Operasional | Pengelola lapangan, koordinator, atau tim IT yang memantau kondisi terpadu, mengkalibrasi okupansi, memantau anomali, dan mengunduh laporan. | Wajib Login (JWT) |

> *Catatan UML:* Pada Use Case Diagram, perangkat **Node IoT (ESP32)** dapat digambarkan sebagai *External System Actor* untuk mekanisme pengiriman event otomatis ke sistem.

### 4.2 Matriks Aktivitas per Aktor

#### A. Aktivitas User (Pengguna Parkir)
1. **Membaca Rekomendasi & Status Cepat:** Membuka halaman Beranda untuk langsung melihat rekomendasi singkat kondisi parkir (apakah masih aman atau perlu menuju area alternatif) dan jumlah slot tersedia saat ini dalam `< 3 detik`.
2. **Memantau Ringkasan Real-Time & Arus Kendaraan:** Melihat sisa slot, persentase terisi/sisa, badge kepadatan (*Tersedia / Waspada / Hampir Penuh / Penuh*), serta arus masuk/keluar terakhir untuk **Motor** dan **Mobil**.
3. **Mengecek Prediksi Multi-Horizon:** Memilih horizon prediksi (**+10**, **+15**, atau **+30 menit**) untuk melihat estimasi slot tersisa dan perkiraan waktu hingga penuh.
4. **Menganalisis Grafik Tren Okupansi:** Membandingkan kurva okupansi aktual hari ini terhadap garis proyeksi Random Forest dan batas kapasitas maksimal.
5. **Melihat Pola & Jam Sibuk Historis:** Membuka halaman **Pola Parkir** untuk mengecek jam-jam tersibuk per hari (berdasarkan data 6 bulan terakhir) guna merencanakan waktu kedatangan ke kampus.
6. **Mengakses Panduan & Informasi Sistem:** Membuka halaman **Panduan** (cara membaca indikator, FAQ, dan info area parkir alternatif) serta halaman **Tentang** (profil sistem, teknologi IoT + ML, dan metrik akurasi).

#### B. Aktivitas Admin (Pengelola Parkir)
1. **Login & Logout Admin:** Mengakses panel pengelola menggunakan akun terotorisasi.
2. **Memantau Dashboard Operasional Terpadu:** Melihat kondisi okupansi saat ini, prediksi jangka pendek, dan peringatan dini *over-capacity* untuk mengarahkan pengendara ke area alternatif (misal area Perpustakaan Utama).
3. **Melakukan Kalibrasi / Koreksi Okupansi Manual:** Mengoreksi jumlah kendaraan terparkir saat ini apabila terjadi selisih antara hitungan sensor dan kondisi fisik di lapangan (*sensor drift*), disertai catatan alasan dan audit log.
4. **Memantau Kesehatan Perangkat & Log Anomali:** Memeriksa status *online/offline* gerbang motor & mobil, melihat aliran event terakhir, dan meninjau interval yang ditandai anomali (`< 0` atau `> kapasitas`).
5. **Mengelola Konfigurasi Parkir:** Mengubah kapasitas maksimal atau ambang batas persentase status (*Waspada* / *Hampir Penuh*) jika ada kebijakan baru.
6. **Mengelola & Mengekspor Rekap Laporan:** Memfilter ringkasan kendaraan masuk/keluar dan puncak okupansi berdasarkan tanggal atau **shift kerja** (Pagi `06:00–14:00` / Sore `14:00–22:00`) serta mengunduh laporan (CSV/Excel).
7. **Menjalankan Simulator IoT (Tahap Pengembangan/Demo):** Memilih skenario tanggal historis, mengatur kecepatan pemutaran, dan mengendalikan *IoT Replay Simulator* untuk demo dan pengujian.

---

## 5. Struktur Modul, Menu & Spesifikasi Antarmuka Web (*UI/UX*)

### 5.1 Prinsip Desain Antarmuka (*Mobile-First & Glanceable*)
Mayoritas mahasiswa mengakses informasi parkir melalui ponsel sebelum atau saat menuju kampus (jam sibuk `07:00–09:00 WIB`). Oleh karena itu, antarmuka dirancang dengan prinsip berikut:
- **Glanceable Decision (< 3 Detik):** Angka yang paling ditonjolkan adalah **Slot Tersedia** dan **Rekomendasi Status**, bukan kapasitas maksimal.
- **Sistem Warna Semantik + Identitas Visual:**
  - Tema utama: Biru tua (`sidebar/header`), putih & biru muda (`area konten`).
  - Pembeda kendaraan: **Hijau** untuk **Motor** dan **Biru** untuk **Mobil**.
  - Badge status kepadatan: Hijau (`Tersedia < 70%`), Kuning (`Waspada 70%–89%`), Oranye (`Hampir Penuh 90%–99%`), Merah (`Penuh 100%`).
- **Navigasi Adaptif:**
  - **Desktop (`>= 1024px`):** *Fixed Left Sidebar* berisi logo ParkInsight, menu publik, dan tautan *Portal Pengelola* di bagian bawah + *Top Header Bar* (judul halaman, tanggal/jam WIB, dan indikator status *Live/Stale*).
  - **Mobile (`< 768px`):** *Compact Top Header* + **Bottom Navigation Bar** (`Beranda`, `Pola Parkir`, `Panduan`, `Tentang`) agar mudah dijangkau satu tangan tanpa membuka menu drawer.

### 5.2 Menu & Komponen Halaman Publik (User)

| Menu / Halaman | Route Next.js | Komponen UI & Informasi yang Ditampilkan |
| :--- | :--- | :--- |
| **1. Beranda (Live Dashboard)** | `/` | • **Live Status & Alert Banner:** Indikator titik *Live* + `"Diperbarui X menit lalu (HH:mm WIB)"`; otomatis berubah menjadi banner peringatan jika data *stale* (`> 10 menit`) atau di luar jam operasional (`22:00–06:00 WIB`).<br>• **Banner Rekomendasi Cepat:** Ringkasan aksi berbasis data aktual + prediksi (contoh: *"Motor masih longgar dan aman 30 menit ke depan"* atau *"Mobil hampir penuh, pertimbangkan area alternatif"*).<br>• **Kartu Ringkasan Motor & Mobil:** Kapasitas maksimal, **Slot Tersedia (angka utama)**, progress bar/donut persentase terisi & sisa, badge status kepadatan, dan indikator **Arus Terakhir** (`+masuk / -keluar` 15 menit terakhir).<br>• **Panel Prediksi Interaktif:** Pemilih horizon **`+10 Menit`** (utama), **`+15 Menit`**, dan **`+30 Menit`** yang menampilkan estimasi slot tersedia, persentase okupansi prediksi, badge status, dan estimasi waktu penuh (muncul dinamis bila tren menuju penuh).<br>• **Grafik Tren Okupansi Hari Ini:** Di mobile menggunakan **Tab Switcher `[Motor | Mobil]`** agar lega dibaca; di desktop tampil bersebelahan/tab penuh. Menampilkan kurva **Aktual** (garis solid), **Prediksi Random Forest** (garis putus-putus + *shaded area*), garis batas **Kapasitas**, penanda waktu *"Sekarang"*, dan *disclaimer* estimasi.<br>• **Kartu Info Operasional:** Jam operasional (`06:00–22:00 WIB`), lokasi (Area Parkir Triguna), jalur terpisah, dan sumber data. |
| **2. Pola Parkir (Insights Historis)** | `/pola-parkir` | • **Filter Jenis Kendaraan & Hari:** Switcher `[Motor | Mobil]` dan pilihan hari (`Senin–Sabtu`).<br>• **Heatmap Kepadatan Mingguan:** Matriks Hari × Jam (`06:00–22:00 WIB`) berdasarkan agregasi dataset 6 bulan terakhir untuk melihat jam-jam rawan penuh.<br>• **Ringkasan Jam Puncak (*Peak Hours*):** Kartu sorotan jam terpadat dan rekomendasi jam kedatangan lebih lengang.<br>• **Perbandingan Hari Ini vs Rata-Rata Historis:** Indikator apakah kondisi hari ini lebih ramai atau lebih sepi dibanding rata-rata hari yang sama. |
| **3. Panduan** | `/panduan` | • **Kartu Sambutan & Langkah Cepat:** Penjelasan 3 langkah membaca informasi aktual vs prediksi.<br>• **Legenda Status & Warna:** Arti label *Tersedia*, *Waspada*, *Hampir Penuh*, *Penuh*, serta arti garis solid vs putus-putus pada grafik.<br>• **Info Kebijakan & Area Alternatif:** Informasi arahan parkir pagi di Triguna dan opsi lokasi alternatif saat terjadi *over-capacity* (misal area Perpustakaan Utama).<br>• **FAQ Singkat:** Jawaban atas pertanyaan umum (keakuratan prediksi, jeda pembaruan data, perbedaan sensor vs kondisi lapangan). |
| **4. Tentang** | `/tentang` | • **Identitas & Visi:** Logo ParkInsight, slogan *"See Beyond the Parking Lot"*, dan latar belakang pengembangan di Lahan Parkir Triguna UIN Jakarta.<br>• **Arsitektur Teknologi:** Penjelasan ringkas alur Sensor IoT (ESP32 + IR) → Backend FastAPI → Model Random Forest Regression → Dashboard Web.<br>• **Transparansi Performa Model:** Ringkasan metrik evaluasi model (`MAE`, `RMSE`, `R²`) agar pengguna dan penilai memahami tingkat keandalan prediksi. |

### 5.3 Menu & Komponen Halaman Admin (Pengelola Parkir)

| Menu / Halaman | Route Next.js | Komponen UI & Informasi yang Ditampilkan |
| :--- | :--- | :--- |
| **1. Login Admin** | `/admin/login` | • Form login username & password, validasi input, dan penanganan pesan error autentikasi. |
| **2. Overview & Kalibrasi** | `/admin` | • **KPI Operasional Hari Ini:** Okupansi saat ini, total kendaraan masuk/keluar hari ini, puncak okupansi, dan status *Over-Capacity Warning*.<br>• **Panel Kalibrasi Cepat:** Form koreksi angka okupansi aktual Motor/Mobil + input alasan wajib + tabel **Riwayat Kalibrasi (*Audit Log*)**.<br>• **Konfigurasi Area Parkir:** Form ubah kapasitas maksimal (`3.000` / `50`) dan ambang batas persentase badge status. |
| **3. Monitoring Perangkat & Simulator** | `/admin/monitoring` | • **Kartu Kesehatan Node IoT:** Status Gerbang Motor & Gerbang Mobil (*Online / Offline*, *Last Seen*, jumlah event hari ini).<br>• **Tabel Log Anomali:** Daftar interval dengan `is_anomaly = true` beserta nilai mentah sebelum pembatasan.<br>• **Live Event Stream:** Daftar 20 event kendaraan terakhir (`timestamp`, `gate`, `direction`, `source`).<br>• **Kontrol Simulator IoT:** Pilih tanggal dari dataset historis, pilih kecepatan replay (`1x`, `10x`, `60x`), serta tombol *Start / Pause / Reset*. |
| **4. Rekap & Laporan** | `/admin/laporan` | • **Filter Laporan:** Rentang tanggal, jenis kendaraan (`Semua / Motor / Mobil`), dan pembagian **Shift** (*Semua / Shift Pagi `06:00–14:00` / Shift Sore `14:00–22:00`*).<br>• **Tabel & Grafik Ringkasan Harian:** Total masuk, total keluar, okupansi puncak, dan jam puncak.<br>• **Ekspor Data:** Tombol unduh laporan dalam format **CSV** atau **Excel (`.xlsx`)**. |

---

## 6. Kebutuhan Fungsional (*Functional Requirements*)

### 6.1 Modul Ingesti Data Kendaraan (`FR-ING`)
| ID | Kebutuhan | Deskripsi Detail | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-ING-01** | Penerimaan Event Kendaraan | Sistem menyediakan endpoint `POST /api/v1/events` dan MQTT subscriber (topic `parkinsight/gates/+/events`) untuk menerima payload `event_id`, `device_id`, `gate`, `vehicle_type` (`motor`/`car`), `direction` (`in`/`out`), `count`, dan `event_timestamp`. | Must Have |
| **FR-ING-02** | Validasi Skema & Otorisasi Sumber | Sistem memvalidasi tipe data, nilai enum (`motor`/`car`, `in`/`out`), `count > 0`, dan identitas pengirim (`device_id`/API key). Payload tidak valid atau sumber tidak dikenal ditolak (`HTTP 400/401`) dan tidak disimpan ke `parking_events` (mengacu **TC-06**). | Must Have |
| **FR-ING-03** | Idempotensi / Anti-Duplikasi Event | Sistem memeriksa keunikan `event_id`. Jika `event_id` yang sama dikirim ulang (misal saat ESP32 memulihkan koneksi Wi-Fi), sistem mengabaikan penyimpanan ulang agar tidak terjadi penghitungan ganda (mengacu **TC-05 & TC-07**). | Must Have |
| **FR-ING-04** | Simulator Replay Data Historis | Sistem menyediakan modul simulator yang mengonversi baris transaksi historis (`Waktu Masuk` & `Waktu Keluar`) menjadi event `in` dan `out` berurutan dan mengirimkannya ke pipeline ingesti dengan penanda `source = 'simulator'`. | Must Have |

### 6.2 Modul Agregasi & Manajemen Okupansi (`FR-OCC`)
| ID | Kebutuhan | Deskripsi Detail | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-OCC-01** | Agregasi Interval 5 Menit | Setiap 5 menit (menit `:00, :05, :10, ...` WIB), sistem mengagregasi `parking_events` menjadi `motor_in`, `motor_out`, `car_in`, dan `car_out` pada tabel `occupancy` (mengacu **TC-08**). | Must Have |
| **FR-OCC-02** | Perhitungan Okupansi & Slot Tersedia | Sistem menghitung okupansi per jenis kendaraan secara terpisah dengan rumus $O_t = \min(C, \max(0, O_{t-1} + M_t - K_t))$ dan slot tersedia $A_t = C - O_t$, serta persentase terisi & sisa yang konsisten ($O_t + A_t = C$). | Must Have |
| **FR-OCC-03** | Penandaan Anomali Batas | Jika nilai mentah $O_{t-1} + M_t - K_t < 0$ atau $> C$, sistem tetap membatasi nilai pada `[0, C]` dan menyetel `is_anomaly = true` beserta keterangan nilai mentah untuk ditinjau Admin (mengacu **TC-09**). | Must Have |
| **FR-OCC-04** | Klasifikasi Status Kepadatan | Sistem menetapkan label status secara otomatis berdasarkan persentase keterisian: `Tersedia` (`< 70%`), `Waspada` (`70%–89%`), `Hampir Penuh` (`90%–99%`), dan `Penuh` (`100%`). | Should Have |

### 6.3 Modul Prediksi Machine Learning (`FR-ML`)
| ID | Kebutuhan | Deskripsi Detail | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-ML-01** | Ekstraksi Fitur Tanpa *Data Leakage* | Setiap selesai agregasi 5 menit, sistem menyusun baris fitur di tabel `features` menggunakan atribut waktu (`hour`, `day_of_week`, `is_weekday`), arus kendaraan saat ini (`motor_in`, `motor_out`, `car_in`, `car_out`), `total_occupancy`, dan fitur historis (*lag* interval sebelumnya) hanya dari waktu $\le t$. | Must Have |
| **FR-ML-02** | Inferensi Model Random Forest | Sistem memuat artefak `rf_motor.joblib` dan `rf_car.joblib` saat startup dan menjalankan prediksi okupansi untuk horizon utama **`t+10` menit** serta horizon pendukung **`t+15`** dan **`t+30` menit** setiap 5 menit (mengacu **TC-10**). | Must Have |
| **FR-ML-03** | Konversi Prediksi & Estimasi Penuh | Sistem mengonversi okupansi prediksi menjadi slot tersedia $\hat{A} = \max(0, C - \hat{O})$, menentukan status prediksi (*Aman/Waspada/Hampir Penuh*), dan menghitung estimasi menit hingga potensi penuh jika laju kenaikan diproyeksikan mencapai kapasitas. | Must Have |
| **FR-ML-04** | Ketahanan (*Graceful Fallback*) | Jika model gagal dieksekusi atau fitur belum cukup (misal baru mulai interval pertama), sistem tetap melayani data okupansi aktual dan menandai status prediksi sebagai `unavailable` tanpa membuat dashboard error. | Must Have |

### 6.4 Modul Antarmuka Web Publik (`FR-UI`)
| ID | Kebutuhan | Deskripsi Detail | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-UI-01** | Status Bar Real-Time & Banner Kondisi Khusus | Header halaman Beranda menampilkan badge `LIVE`, stempel waktu `last_updated` (WIB), dan countdown/indikator pembaruan otomatis (`5–10 detik`). Jika data terlambat melampaui batas toleransi (`is_stale`) atau berada di luar jam operasional (`06:00–22:00 WIB`), tampilkan banner peringatan atau informasi jam layanan dengan jelas (mengacu **TC-14**). | Must Have |
| **FR-UI-02** | Quick Action Recommendation Banner | Halaman Beranda menampilkan banner rekomendasi cepat yang merangkum kondisi terkini dan prediksi jangka pendek untuk Motor & Mobil dalam satu kalimat aksi (*glanceable < 3 detik*), termasuk saran area alternatif (misal Parkiran Perpustakaan Utama) saat utilisasi mendekati/melewati batas `Padat`/`Penuh`. | Should Have |
| **FR-UI-03** | Kartu Okupansi & Indikator Arus 15 Menit | Halaman Beranda menampilkan kartu Motor dan Mobil yang menonjolkan angka **Slot Tersedia** sebagai informasi utama, disertai progress bar semantik (Hijau/Kuning/Merah), kapasitas maksimal, okupansi terisi, persentase sisa/terisi (konsisten dari satu rumus tunggal `available = capacity - occupied`), serta indikator arus masuk/keluar 15 menit terakhir (`+masuk / -keluar`) untuk menunjukkan arah tren terkini (mengacu **TC-11**). | Must Have |
| **FR-UI-04** | Panel Prediksi Interaktif (`+10/+15/+30` Menit) | Halaman Beranda menampilkan panel prediksi Random Forest dengan *segmented pill switcher* (`+10 Menit`, `+15 Menit`, `+30 Menit`) untuk melihat proyeksi slot tersedia, badge status prediksi, serta estimasi waktu penuh yang hanya muncul bila laju pengisian diproyeksikan mencapai kapasitas penuh, disertai label tegas bahwa angka merupakan estimasi model ML (mengacu **TC-12**). | Must Have |
| **FR-UI-05** | Grafik Tren Okupansi & Tab Mobile | Halaman Beranda menampilkan grafik tren okupansi per kendaraan dengan pemisahan visual garis aktual (solid), garis prediksi Random Forest (putus-putus), dan garis kapasitas maksimal beserta tooltip interaktif per waktu (`WIB`) dan catatan kaki sumber estimasi. Pada layar mobile (`< 768px`), grafik menggunakan tab switcher `[Motor | Mobil]` agar halaman tetap ringkas (mengacu **TC-12**). | Must Have |
| **FR-UI-06** | Halaman Pola Parkir Historis (`/pola-parkir`) | Pengguna dapat mengakses halaman `/pola-parkir` untuk melihat *heatmap* okupansi rata-rata per Hari (Senin–Minggu) × Jam (`06:00–22:00 WIB`), highlight jam paling padat vs jam paling sepi, serta rekomendasi jam kedatangan optimal berbasis agregasi dataset historis 6 bulan. | Should Have |
| **FR-UI-07** | Halaman Panduan (`/panduan`) & Tentang (`/tentang`) | Pengguna dapat mengakses halaman `/panduan` (arti warna status, cara baca grafik & label prediksi, FAQ, serta informasi alternatif parkir) dan `/tentang` (latar belakang, metode IoT + Random Forest, batasan sistem, dan tim pengembang). | Must Have |
| **FR-UI-08** | Navigasi Adaptif & Desain Responsif Mobile-First | Antarmuka menerapkan prinsip *mobile-first*: pada desktop (`>= 1024px`) menggunakan sidebar navigasi kiri, sedangkan pada mobile (`< 768px`) menggunakan *Bottom Navigation Bar* tetap (`Beranda`, `Pola`, `Panduan`, `Tentang`) serta tata letak vertikal tanpa teks terpotong atau *horizontal overflow* (mengacu **TC-13**). | Must Have |

### 6.5 Modul Administrasi & Operasional (`FR-ADM`)
| ID | Kebutuhan | Deskripsi Detail | Prioritas |
| :--- | :--- | :--- | :--- |
| **FR-ADM-01** | Autentikasi Admin | Sistem menyediakan login berbasis username/password dan mengeluarkan JWT untuk melindungi seluruh endpoint `/api/v1/admin/*` dan halaman `/admin/*`. | Must Have |
| **FR-ADM-02** | Kalibrasi Okupansi Manual | Admin dapat menginput jumlah kendaraan terparkir aktual untuk Motor atau Mobil beserta catatan alasan; sistem menyisipkan event penyesuaian/baseline baru dan menyimpan riwayat kalibrasi di audit log. | Must Have |
| **FR-ADM-03** | Pemantauan Perangkat & Anomali | Admin dapat melihat status perangkat gerbang (*online/offline* berdasarkan *heartbeat*/event terakhir) dan daftar interval dengan `is_anomaly = true`. | Should Have |
| **FR-ADM-04** | Konfigurasi Kapasitas & Ambang Batas | Admin dapat memperbarui nilai kapasitas maksimal dan ambang batas persentase status (`Waspada`, `Hampir Penuh`) yang langsung dipakai perhitungan backend dan tampilan UI. | Should Have |
| **FR-ADM-05** | Kontrol Simulator IoT via UI | Admin dapat menjalankan, mengatur kecepatan (misal `1x`, `10x`, `60x`), dan menghentikan simulator replay dataset historis langsung dari halaman `/admin/monitoring`. | Should Have |
| **FR-ADM-06** | Rekap & Ekspor Laporan Harian/Shift | Admin dapat melihat tabel ringkasan masuk, keluar, dan puncak okupansi per hari atau per shift (Pagi `06:00–14:00`, Sore `14:00–22:00`) serta mengunduh hasilnya dalam format CSV/Excel. | Could Have |

---

## 7. Kebutuhan Non-Fungsional (*Non-Functional Requirements*)

| ID | Aspek | Kriteria Terukur |
| :--- | :--- | :--- |
| **NFR-01** | **Performa API** | Endpoint `GET /api/v1/dashboard/summary` dan `/trends` merespons `< 200 ms` (p95) karena membaca hasil agregasi dan prediksi yang sudah tersimpan di PostgreSQL. |
| **NFR-02** | **Keterkinian (*Latency*)** | Event dari IoT/Simulator tersimpan ke DB `< 2 detik` dan tampil di dashboard maksimal dalam `10 detik` melalui polling frontend. |
| **NFR-03** | **Konsistensi Zona Waktu** | Seluruh penyimpanan dan pertukaran data menggunakan ISO-8601 dengan offset `+07:00` (`Asia/Jakarta` / WIB). |
| **NFR-04** | **Keamanan** | Endpoint admin terproteksi JWT & password di-hash dengan `bcrypt`; endpoint ingesti IoT dilindungi `X-Device-Key` / kredensial MQTT; validasi CORS hanya mengizinkan domain frontend resmi. |
| **NFR-05** | **Reliabilitas & Offline Resilience** | Sistem tetap beroperasi jika koneksi perangkat IoT terputus sementara, dan melakukan sinkronisasi data susulan secara idempoten saat koneksi pulih. |
| **NFR-06** | **Kesesuaian Uji Proposal** | Seluruh fitur terverifikasi terhadap 15 skenario *Black Box Testing* (`TC-01` s.d. `TC-15` pada Tabel 18 proposal). |

---

## 8. Aturan Bisnis & Spesifikasi Data Inti

### 8.1 Aturan Bisnis Utama
1. **Rumus Okupansi & Kapasitas:**
   $$O_t = \min(C, \max(0, O_{t-1} + M_t - K_t)), \quad A_t = C - O_t$$
   dengan default $C_{\text{motor}} = 3.000$ dan $C_{\text{mobil}} = 50$.
2. **Rumus Konversi Prediksi:**
   $$\hat{A}_{\text{motor}} = \max(0, C_{\text{motor}} - \hat{O}_{\text{motor}}), \quad \hat{A}_{\text{mobil}} = \max(0, C_{\text{mobil}} - \hat{O}_{\text{mobil}})$$
3. **Pemisahan Label Data:** Data aktual dan data prediksi tidak boleh digabung tanpa pembeda di UI maupun di tabel database.
4. **Reset / Kalibrasi Operasional:** Nilai okupansi awal hari mengikuti kondisi akhir sebelumnya atau hasil kalibrasi admin; tidak pernah menampilkan nilai negatif.

### 8.2 Ringkasan Tabel Database PostgreSQL
1. `parking_config` — `vehicle_type` (PK), `capacity`, `warning_pct`, `critical_pct`, `updated_at`.
2. `parking_events` — `id`, `event_id` (UNIQUE), `device_id`, `gate`, `vehicle_type`, `direction`, `count`, `event_timestamp`, `received_at`, `source`.
3. `occupancy` — `id`, `interval_start` (UNIQUE), `motor_in`, `motor_out`, `car_in`, `car_out`, `motor_occupancy`, `car_occupancy`, `total_occupancy`, `is_anomaly`, `anomaly_note`, `created_at`.
4. `features` — `id`, `interval_start` (UNIQUE), `hour`, `day_of_week`, `is_weekday`, `motor_in`, `motor_out`, `car_in`, `car_out`, `total_occupancy`, `motor_occupancy_lag_1`, `motor_occupancy_lag_2`, `car_occupancy_lag_1`, `car_occupancy_lag_2`, `created_at`.
5. `prediction` — `id`, `base_timestamp`, `target_timestamp`, `horizon_minutes`, `vehicle_type`, `predicted_occupancy`, `predicted_available`, `status_label`, `model_version`, `created_at`.
6. `calibration_logs` — `id`, `admin_id`, `vehicle_type`, `previous_occupancy`, `calibrated_occupancy`, `reason`, `created_at`.
7. `admin_users` — `id`, `username` (UNIQUE), `password_hash`, `role`, `created_at`.

### 8.3 Daftar Endpoint API Inti (FastAPI)
- **Publik:**
  - `GET /api/v1/health` — Status layanan DB, scheduler, MQTT, dan model ML.
  - `GET /api/v1/dashboard/summary` — Ringkasan kondisi terkini (termasuk arus masuk/keluar 15 menit terakhir, `recommendation`, `last_updated`, `is_stale`, dan status jam operasional) + prediksi `10/15/30` menit.
  - `GET /api/v1/dashboard/trends?date=YYYY-MM-DD` — Data deret waktu aktual & prediksi untuk grafik Beranda.
  - `GET /api/v1/dashboard/patterns?vehicle_type=motor|mobil` — Agregasi historis okupansi per hari × jam (`06:00–22:00 WIB`) beserta ringkasan jam puncak/sepi untuk halaman `/pola-parkir`.
- **Ingesti (IoT / Simulator):**
  - `POST /api/v1/events` — Menerima event kendaraan (idempoten berdasarkan `event_id`).
- **Admin (JWT Protected):**
  - `POST /api/v1/auth/login` — Autentikasi admin.
  - `POST /api/v1/admin/calibrate` — Koreksi okupansi manual.
  - `PUT /api/v1/admin/config/{vehicle_type}` — Update kapasitas & threshold status.
  - `GET /api/v1/admin/monitoring` — Status perangkat, daftar anomali, dan event terakhir.
  - `POST /api/v1/admin/simulator/{start|stop}` — Kontrol simulator replay data historis.
  - `GET /api/v1/admin/reports/export` — Unduh rekap data CSV/Excel (termasuk rekap per shift pagi/sore).

---

## 9. Pemetaan Kebutuhan ke Skenario Pengujian Proposal (Tabel 18)

| Kode Uji | Komponen | Kebutuhan Terkait | Target Verifikasi |
| :--- | :--- | :--- | :--- |
| **TC-01 – TC-03** | Perangkat IoT | `FR-ING-01` | Event masuk (`A→B`), keluar (`B→A`), dan pemisahan jenis kendaraan dari gerbang tercatat benar. |
| **TC-04 – TC-05** | Komunikasi Jaringan | `FR-ING-01`, `FR-ING-03`, `NFR-05` | Pengiriman MQTT/HTTP lengkap tanpa duplikasi termasuk setelah Wi-Fi terputus sementara. |
| **TC-06 – TC-07** | Backend | `FR-ING-02`, `FR-ING-03` | Payload rusak/ilegal ditolak; `event_id` duplikat tidak dihitung ganda. |
| **TC-08 – TC-09** | Basis Data & Okupansi | `FR-OCC-01`, `FR-OCC-02`, `FR-OCC-03` | Agregasi 5 menit cocok dengan event mentah; batas `[0, C]` dan flag anomali bekerja. |
| **TC-10** | Model Prediksi | `FR-ML-01`, `FR-ML-02`, `FR-ML-03` | Inferensi Random Forest `t+10` (dan `15/30`) menghasilkan angka non-negatif di tabel `prediction`. |
| **TC-11 – TC-14** | Dashboard Web | `FR-UI-01`, `FR-UI-03`–`FR-UI-05`, `FR-UI-08` | Data sesuai DB, label aktual vs prediksi terpisah, responsif desktop/mobile, dan muncul peringatan saat data usang. |
| **TC-15** | Integrasi Menyeluruh | Semua Modul | Penelusuran 1 kendaraan dari deteksi/simulator hingga tampil konsisten di dashboard web. |
