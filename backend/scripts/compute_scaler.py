"""
Tính StandardScaler params (mean, std) trên toàn dataset.
Chạy TRƯỚC extract_all_features.py.

Usage:
    python -m backend.scripts.compute_scaler
"""

import sys
import numpy as np
from pathlib import Path
from tqdm import tqdm

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

import librosa
from backend.features.mfcc     import extract_mfcc_features
from backend.features.temporal import extract_temporal_features
from backend.features.harmonic import extract_harmonic_features
from backend.features.extractor import get_all_feature_names

PROCESSED_DIR = BASE_DIR / "data" / "processed"
SCALER_PATH   = BASE_DIR / "backend" / "features" / "scaler_params.npz"
CLASS_FOLDERS = [
    "airplane", "bicycle", "bus", "car",
    "helicopter", "motorcycle", "train", "truck",
]
TARGET_SR = 22050


def extract_raw(filepath: Path) -> np.ndarray:
    """Extract feature KHÔNG normalize — để tính scaler params."""
    y, sr = librosa.load(str(filepath), sr=TARGET_SR, mono=True)
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    min_samples = sr // 2
    if len(y) < min_samples:
        y = np.pad(y, (0, min_samples - len(y)))

    mfcc_feats     = extract_mfcc_features(y, sr)
    temporal_feats = extract_temporal_features(y, sr)
    harmonic_feats = extract_harmonic_features(y, sr)
    meta = {**mfcc_feats, **temporal_feats, **harmonic_feats}

    feature_names = get_all_feature_names()
    vector = np.array([meta[name] for name in feature_names], dtype=np.float32)

    # Chỉ replace NaN/Inf, KHÔNG scale
    vector = np.nan_to_num(vector, nan=0.0, posinf=0.0, neginf=0.0)
    return vector


def main():
    print("Tính StandardScaler params trên toàn dataset...")

    all_files = []
    for cls in CLASS_FOLDERS:
        folder = PROCESSED_DIR / cls
        if folder.exists():
            all_files.extend(sorted(folder.glob("*.wav")))

    print(f"Tổng: {len(all_files)} files\n")

    all_vectors = []
    errors = 0
    for fp in tqdm(all_files, desc="Extracting raw features"):
        try:
            vec = extract_raw(fp)
            all_vectors.append(vec)
        except Exception as e:
            tqdm.write(f"[ERROR] {fp.name}: {e}")
            errors += 1

    matrix = np.stack(all_vectors)   # shape (N, 72)
    mean   = matrix.mean(axis=0)
    std    = matrix.std(axis=0)

    # Các feature có std ≈ 0 (hằng số) → set std = 1 để tránh chia 0
    zero_std = np.sum(std < 1e-8)
    std = np.where(std < 1e-8, 1.0, std)

    np.savez(SCALER_PATH, mean=mean, std=std)

    print(f"\nHoàn thành!")
    print(f"  Files OK  : {len(all_vectors)}")
    print(f"  Lỗi       : {errors}")
    print(f"  Feature dim: {matrix.shape[1]}")
    print(f"  Zero-std features: {zero_std}")
    print(f"  Lưu tại: {SCALER_PATH}")

    # In thống kê vài feature để kiểm tra
    names = get_all_feature_names()
    print(f"\nSample scaler params:")
    for i in [0, 13, 26, 52, 65, 71]:
        print(f"  {names[i]:<30} mean={mean[i]:>10.4f}  std={std[i]:>10.4f}")


if __name__ == "__main__":
    main()