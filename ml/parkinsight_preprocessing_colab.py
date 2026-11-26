"""
ParkInsight — Data Preprocessing Pipeline (Google Colab & Local Ready)
====================================================================
Mengubah data transaksi mentah `data_trans_6_bulan_terakhir.xlsx` menjadi:
1. Tabel `occupancy` (agregasi interval 5 menit untuk motor & mobil)
2. Tabel `features` siap latih untuk Random Forest Regression (`t+10`, `t+15`, `t+30`)
3. Pembagian kronologis Train/Test 80:20 tanpa data leakage

Aturan seleksi pos & pembersihan anomali (berdasarkan audit dataset):
- Hapus duplikat, timestamp tidak valid (< 2020), durasi <= 0 atau > 24 jam, dan kategori `BOX`.
- Hapus baris dengan `Pos Masuk` berawalan `PK*` (anomali input manual/tiket hilang
  di pos keluar yang menyetel durasi sintetis tepat 60,0 menit pada 69%-100% baris).
- Motor (C = 3.000): gabungkan seluruh pos `PM*` motor (`PM1A-D` + `PM2A-D`, opsional
  kecualikan `PM1E REKTOR`), filter kendaraan mengandung `"MOTOR"`.
- Mobil (C = 50): gabungkan seluruh pos `PM*` mobil KECUALI `PM1D MBL` (anomali skala
  karena puncak hari kerjanya 165-348 mobil), filter kendaraan mengandung `"MOBIL"`.
- Hitung okupansi kontinu pada grid 5 menit 24 jam agar sisa kendaraan antar-hari
  terjaga, tandai `is_anomaly`, terapkan `clip` batas [0, C] sesuai Persamaan (1),
  lalu bentuk fitur lag dan target sebelum memfilter jam operasional `06:00-22:00 WIB`.
"""

from __future__ import annotations

import os
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


# ==============================================================================
# KONFIGURASI (Ubah path di bawah sesuai lokasi file di Google Drive / Colab)
# ==============================================================================
@dataclass(frozen=True)
class PreprocessConfig:
    input_xlsx_path: str = "dataset/data_trans_6_bulan_terakhir.xlsx"
    output_dir: str = "ml/output"

    # Kapasitas Area Parkir Triguna (Proposal Subbab 3.1 & PRD Section 8.1)
    motor_capacity: int = 3000
    car_capacity: int = 50

    # Aturan seleksi gerbang & penanganan anomali
    exclude_pk_as_entry: bool = True         # Wajib True (anomali durasi sintetis 60 menit)
    exclude_pm_as_exit: bool = False         # Opsional: 924 baris (0,19%) keluar lewat PM*
    exclude_rektor_for_motor: bool = True    # Opsional kecualikan PM1E REKTOR untuk motor
    excluded_car_entry_gates: tuple[str, ...] = ("PM1D MBL",)

    # Penanganan hari lonjakan ekstrem mobil (7 event weekend >100 + 1 Rabu = 8 hari)
    car_clip_to_capacity: bool = True        # Sesuai Persamaan (1): Ot = min(C, max(0, ...))
    drop_car_overflow_days_for_ml: bool = False  # Set True jika ingin drop 8 hari > cap*1.2 untuk ML

    # Pengaturan deret waktu
    interval_freq: str = "5min"
    ops_start_hour: int = 6                  # 06:00 WIB
    ops_end_hour_exclusive: int = 22         # s/d 21:55 WIB (192 interval/hari)
    drop_first_day_warmup: bool = True       # Buang hari ke-1 (warmup sisa menginap)
    train_ratio: float = 0.80                # Split kronologis 80:20


def mount_google_drive_if_colab() -> bool:
    """Mount Google Drive secara otomatis jika script dijalankan di Google Colab."""
    try:
        from google.colab import drive  # type: ignore

        mount_point = "/content/drive"
        if not os.path.exists(f"{mount_point}/MyDrive"):
            drive.mount(mount_point)
        return True
    except ImportError:
        return False


def load_excel_transactions_fast(xlsx_path: str | Path) -> pd.DataFrame:
    """
    Membaca sheet pertama `data_trans_6_bulan_terakhir.xlsx` dengan streaming XML.
    Jauh lebih cepat (~5-8 detik untuk 482rb baris di Colab) dibanding openpyxl (~2 menit).
    """
    path = Path(xlsx_path)
    if not path.exists():
        raise FileNotFoundError(
            f"File dataset tidak ditemukan di: {path.resolve()}\n"
            "Jika di Google Colab, pastikan Drive sudah di-mount dan path CONFIG benar."
        )

    with zipfile.ZipFile(path) as zf:
        ss_root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
        shared_strings = [
            "".join(t.text or "" for t in si.iter() if t.tag.endswith("t"))
            for si in ss_root
        ]

        rows: list[tuple[str | None, ...]] = []
        ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
        with zf.open("xl/worksheets/sheet1.xml") as sheet_file:
            for _, elem in ET.iterparse(sheet_file, events=("end",)):
                if elem.tag != f"{ns}row":
                    continue
                row_idx = int(elem.attrib.get("r", 0))
                if row_idx > 1:  # Lewati header baris 1
                    rec = {}
                    for cell in elem:
                        col = "".join(ch for ch in cell.attrib.get("r", "") if ch.isalpha())
                        if col in ("A", "B", "C", "D", "E"):
                            val_el = cell.find(f"{ns}v")
                            val = val_el.text if val_el is not None else None
                            if cell.attrib.get("t", "") == "s" and val is not None:
                                val = shared_strings[int(val)]
                            rec[col] = val
                    rows.append((
                        rec.get("A"),
                        rec.get("B"),
                        rec.get("C"),
                        rec.get("D"),
                        rec.get("E"),
                    ))
                elem.clear()

    df = pd.DataFrame(
        rows,
        columns=["waktu_masuk_raw", "pos_masuk", "waktu_keluar_raw", "pos_keluar", "kendaraan"],
    )
    # Konversi serial date Excel (origin 1899-12-30) ke datetime (WIB / naive local)
    df["waktu_masuk"] = pd.to_datetime(
        pd.to_numeric(df["waktu_masuk_raw"], errors="coerce"),
        unit="D",
        origin="1899-12-30",
    )
    df["waktu_keluar"] = pd.to_datetime(
        pd.to_numeric(df["waktu_keluar_raw"], errors="coerce"),
        unit="D",
        origin="1899-12-30",
    )
    return df[["waktu_masuk", "pos_masuk", "waktu_keluar", "pos_keluar", "kendaraan"]]


def clean_transactions(
    df_raw: pd.DataFrame, cfg: PreprocessConfig
) -> tuple[pd.DataFrame, dict[str, int]]:
    """
    Pembersihan transaksi mentah & penghapusan anomali struktural sesuai audit data.
    Mengembalikan DataFrame bersih dan log ringkasan jumlah baris tiap tahap.
    """
    audit_log: dict[str, int] = {"01_raw_rows": len(df_raw)}

    df = df_raw.drop_duplicates().copy()
    audit_log["02_after_dedup"] = len(df)

    # Filter timestamp valid (tahun >= 2020 untuk buang sentinel tahun 1900/NaT)
    valid_ts = (
        df["waktu_masuk"].notna()
        & df["waktu_keluar"].notna()
        & (df["waktu_masuk"].dt.year >= 2020)
        & (df["waktu_keluar"].dt.year >= 2020)
    )
    df = df[valid_ts].copy()
    audit_log["03_after_valid_timestamp"] = len(df)

    # Filter durasi logis: 0 < durasi <= 24 jam (86.400 detik)
    df["durasi_detik"] = (df["waktu_keluar"] - df["waktu_masuk"]).dt.total_seconds()
    df = df[(df["durasi_detik"] > 0) & (df["durasi_detik"] <= 86400)].copy()
    audit_log["04_after_duration_0_24h"] = len(df)

    # Hapus kategori BOX (hanya Motor & Mobil yang dimodelkan)
    df["kendaraan"] = df["kendaraan"].astype(str).str.strip()
    df["pos_masuk"] = df["pos_masuk"].astype(str).str.strip()
    df["pos_keluar"] = df["pos_keluar"].astype(str).str.strip()
    df = df[df["kendaraan"] != "BOX"].copy()
    audit_log["05_after_drop_box"] = len(df)

    # Hapus anomali Pos Masuk berkode PK* (input manual kasir dengan durasi sintetis 60m)
    if cfg.exclude_pk_as_entry:
        df = df[df["pos_masuk"].str.startswith("PM")].copy()
        audit_log["06_after_drop_pk_as_entry"] = len(df)

    if cfg.exclude_pm_as_exit:
        df = df[df["pos_keluar"].str.startswith("PK")].copy()
        audit_log["07_after_drop_pm_as_exit"] = len(df)

    # Klasifikasi jenis kendaraan berdasarkan kolom Kendaraan (bukan nama pos!)
    df["vehicle_type"] = np.where(
        df["kendaraan"].str.contains("MOTOR", case=False, na=False),
        "motor",
        "car",
    )
    return df, audit_log


def split_vehicle_datasets(
    df_clean: pd.DataFrame, cfg: PreprocessConfig
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Memisahkan dataset motor & mobil dengan pengecualian pos anomali masing-masing."""
    motor_mask = df_clean["vehicle_type"] == "motor"
    if cfg.exclude_rektor_for_motor:
        motor_mask &= df_clean["pos_masuk"] != "PM1E REKTOR"
    df_motor = df_clean[motor_mask].copy()

    car_mask = (df_clean["vehicle_type"] == "car") & (
        ~df_clean["pos_masuk"].isin(cfg.excluded_car_entry_gates)
    )
    df_car = df_clean[car_mask].copy()
    return df_motor, df_car


def aggregate_vehicle_flow(
    df_vehicle: pd.DataFrame,
    grid_index: pd.DatetimeIndex,
    freq: str,
    prefix: str,
    capacity: int,
) -> pd.DataFrame:
    """
    Mengagregasi arus masuk & keluar pada interval 5 menit secara kontinu,
    lalu menghitung okupansi mentah, flag anomali, dan okupansi terkalibrasi [0, C].
    """
    in_counts = (
        df_vehicle["waktu_masuk"]
        .dt.floor(freq)
        .value_counts()
        .reindex(grid_index, fill_value=0)
    )
    out_counts = (
        df_vehicle["waktu_keluar"]
        .dt.floor(freq)
        .value_counts()
        .reindex(grid_index, fill_value=0)
    )

    net_flow = in_counts - out_counts
    # Hitung okupansi kumulatif kontinu (selaras O_t = O_{t-1} + M_t - K_t)
    raw_occ = net_flow.cumsum().astype(int)
    is_anomaly = (raw_occ < 0) | (raw_occ > capacity)
    clipped_occ = raw_occ.clip(lower=0, upper=capacity)

    return pd.DataFrame(
        {
            f"{prefix}_in": in_counts.astype(int),
            f"{prefix}_out": out_counts.astype(int),
            f"{prefix}_net_flow": net_flow.astype(int),
            f"{prefix}_occupancy_raw": raw_occ,
            f"{prefix}_occupancy": clipped_occ.astype(int),
            f"{prefix}_is_anomaly": is_anomaly,
        },
        index=grid_index,
    )


def build_occupancy_table(
    df_motor: pd.DataFrame, df_car: pd.DataFrame, cfg: PreprocessConfig
) -> pd.DataFrame:
    """Membentuk tabel `occupancy` penuh 24 jam pada rentang tanggal transaksi masuk."""
    start_ts = df_motor["waktu_masuk"].dt.normalize().min()
    end_ts = df_motor["waktu_masuk"].dt.normalize().max() + pd.Timedelta(hours=23, minutes=55)
    grid_index = pd.date_range(start=start_ts, end=end_ts, freq=cfg.interval_freq)

    motor_df = aggregate_vehicle_flow(
        df_motor, grid_index, cfg.interval_freq, "motor", cfg.motor_capacity
    )
    car_df = aggregate_vehicle_flow(
        df_car, grid_index, cfg.interval_freq, "car", cfg.car_capacity
    )

    occ = pd.concat([motor_df, car_df], axis=1)
    occ.index.name = "interval_start"
    occ = occ.reset_index()

    # Gunakan raw atau clipped untuk car_occupancy sesuai konfigurasi
    if not cfg.car_clip_to_capacity:
        occ["car_occupancy"] = occ["car_occupancy_raw"]

    occ["total_occupancy"] = occ["motor_occupancy"] + occ["car_occupancy"]
    occ["is_anomaly"] = occ["motor_is_anomaly"] | occ["car_is_anomaly"]
    occ["anomaly_note"] = np.where(
        occ["car_occupancy_raw"] > cfg.car_capacity,
        "car_occupancy_exceeds_capacity",
        np.where(occ["motor_occupancy_raw"] > cfg.motor_capacity, "motor_occupancy_exceeds_capacity", ""),
    )
    return occ


def build_features_and_targets(occ: pd.DataFrame, cfg: PreprocessConfig) -> pd.DataFrame:
    """
    Menyusun fitur temporal, lag historis, dan target prediksi (t+10, t+15, t+30)
    pada grid kontinu agar tidak terjadi data leakage maupun putus di batas jam 06:00.
    """
    feat = occ.copy()

    # Fitur temporal (WIB)
    feat["hour"] = feat["interval_start"].dt.hour
    feat["minute"] = feat["interval_start"].dt.minute
    feat["minute_of_day"] = feat["hour"] * 60 + feat["minute"]
    feat["day_of_week"] = feat["interval_start"].dt.dayofweek  # 0=Senin .. 6=Minggu
    feat["is_weekday"] = (feat["day_of_week"] < 5).astype(int)

    # Fitur lag historis (5, 10, 15 menit sebelumnya pada grid kontinu)
    for lag in (1, 2, 3):
        feat[f"motor_occupancy_lag_{lag}"] = feat["motor_occupancy"].shift(lag)
        feat[f"car_occupancy_lag_{lag}"] = feat["car_occupancy"].shift(lag)
        feat[f"motor_in_lag_{lag}"] = feat["motor_in"].shift(lag)
        feat[f"car_in_lag_{lag}"] = feat["car_in"].shift(lag)

    # Rolling average arus 15 menit terakhir (3 interval termasuk t)
    feat["motor_in_roll15"] = feat["motor_in"].rolling(3).sum()
    feat["motor_out_roll15"] = feat["motor_out"].rolling(3).sum()
    feat["car_in_roll15"] = feat["car_in"].rolling(3).sum()
    feat["car_out_roll15"] = feat["car_out"].rolling(3).sum()

    # Target masa depan: +10 menit (2 step), +15 menit (3 step), +30 menit (6 step)
    for horizon_min, steps in ((10, 2), (15, 3), (30, 6)):
        feat[f"motor_occupancy_t+{horizon_min}"] = feat["motor_occupancy"].shift(-steps)
        feat[f"car_occupancy_t+{horizon_min}"] = feat["car_occupancy"].shift(-steps)

    # Tandai hari overflow mobil (> 120% kapasitas = 60 mobil) agar mudah difilter
    daily_max_car_raw = feat.groupby(feat["interval_start"].dt.date)["car_occupancy_raw"].transform("max")
    feat["is_car_overflow_day"] = daily_max_car_raw > (cfg.car_capacity * 1.20)

    # Filter opsional: buang hari ke-1 (warmup sisa semalam) & fokus jam operasional 06:00-21:55
    first_date = feat["interval_start"].dt.date.min()
    if cfg.drop_first_day_warmup:
        feat = feat[feat["interval_start"].dt.date > first_date]

    ops_mask = (feat["hour"] >= cfg.ops_start_hour) & (feat["hour"] < cfg.ops_end_hour_exclusive)
    feat = feat[ops_mask].copy()

    if cfg.drop_car_overflow_days_for_ml:
        feat = feat[~feat["is_car_overflow_day"]].copy()

    # Buang baris dengan NaN akibat lag/target shift di ujung periode
    required_cols: Iterable[str] = [
        "motor_occupancy_lag_3",
        "car_occupancy_lag_3",
        "motor_occupancy_t+30",
        "car_occupancy_t+30",
    ]
    feat = feat.dropna(subset=list(required_cols)).reset_index(drop=True)

    # Konversi tipe lag & target ke integer agar rapi
    int_cols = [c for c in feat.columns if "lag_" in c or "roll15" in c or "_t+" in c]
    feat[int_cols] = feat[int_cols].astype(int)
    return feat


def chronological_train_test_split(
    feat: pd.DataFrame, train_ratio: float
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Membagi dataset latih & uji secara kronologis (tanpa shuffle) sesuai Proposal 4.3.4."""
    split_idx = int(len(feat) * train_ratio)
    train_df = feat.iloc[:split_idx].copy()
    test_df = feat.iloc[split_idx:].copy()
    return train_df, test_df


def run_pipeline(cfg: PreprocessConfig) -> dict[str, pd.DataFrame]:
    """Menjalankan seluruh pipeline preprocessing dan mengekspor file CSV siap latih."""
    is_colab = mount_google_drive_if_colab()
    print(f"Environment: {'Google Colab' if is_colab else 'Lokal Python'}")

    print(f"[1/6] Membaca dataset: {cfg.input_xlsx_path}")
    df_raw = load_excel_transactions_fast(cfg.input_xlsx_path)

    print("[2/6] Membersihkan baris & menghapus anomali PK*...")
    df_clean, audit_log = clean_transactions(df_raw, cfg)
    for stage, count in audit_log.items():
        print(f"      - {stage}: {count:,} baris")

    print("[3/6] Memisahkan dataset Motor & Mobil sesuai seleksi pos...")
    df_motor, df_car = split_vehicle_datasets(df_clean, cfg)
    print(f"      - Motor bersih (`PM*`): {len(df_motor):,} transaksi")
    print(f"      - Mobil bersih (`PM*` minus `PM1D MBL`): {len(df_car):,} transaksi")

    print("[4/6] Agregasi 5-menit kontinu & pembentukan tabel `occupancy`...")
    occ = build_occupancy_table(df_motor, df_car, cfg)
    print(f"      - Total interval 5-menit (24 jam): {len(occ):,} baris")
    print(f"      - Max motor_occupancy: {occ['motor_occupancy'].max()} / {cfg.motor_capacity}")
    print(
        f"      - Max car_occupancy_raw: {occ['car_occupancy_raw'].max()} "
        f"(clipped ke {occ['car_occupancy'].max()} / {cfg.car_capacity})"
    )
    print(f"      - Interval anomali mobil (> {cfg.car_capacity}): {(occ['car_occupancy_raw'] > cfg.car_capacity).sum():,} baris")

    print("[5/6] Rekayasa fitur lag & target (+10/+15/+30 menit) jam operasional 06:00-22:00...")
    feat = build_features_and_targets(occ, cfg)
    train_df, test_df = chronological_train_test_split(feat, cfg.train_ratio)
    print(f"      - Dataset fitur ML siap pakai: {len(feat):,} baris")
    print(
        f"      - Train (80%): {len(train_df):,} baris "
        f"({train_df['interval_start'].min()} s/d {train_df['interval_start'].max()})"
    )
    print(
        f"      - Test  (20%): {len(test_df):,} baris "
        f"({test_df['interval_start'].min()} s/d {test_df['interval_start'].max()})"
    )

    print(f"[6/6] Menyimpan output CSV ke folder `{cfg.output_dir}`...")
    out_dir = Path(cfg.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    occ.to_csv(out_dir / "occupancy_5min.csv", index=False)
    feat.to_csv(out_dir / "features_ml_ready.csv", index=False)
    train_df.to_csv(out_dir / "train_features.csv", index=False)
    test_df.to_csv(out_dir / "test_features.csv", index=False)
    print("Selesai!")

    return {
        "clean_transactions": df_clean,
        "occupancy": occ,
        "features": feat,
        "train": train_df,
        "test": test_df,
    }


if __name__ == "__main__":
    config = PreprocessConfig(
        # Jika di Google Colab + Drive, ubah ke contoh:
        # input_xlsx_path="/content/drive/MyDrive/ParkInsight/data_trans_6_bulan_terakhir.xlsx",
        # output_dir="/content/drive/MyDrive/ParkInsight/output",
        input_xlsx_path=r"d:\Folder Dappaa\Coolyeah\Topik Khusus\Project Capstone\dataset\data_trans_6_bulan_terakhir.xlsx",
        output_dir=r"d:\Folder Dappaa\Coolyeah\Topik Khusus\Project Capstone\ml\output",
    )
    run_pipeline(config)
