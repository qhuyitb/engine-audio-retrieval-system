"""
Script tiền xử lý dataset audio:
- Đọc file .wav từ thư mục raw theo từng class
- Convert về mono và resample về 22050Hz
- Chuẩn hóa biên độ về [-1, 1]
- Đổi tên file và lưu sang thư mục processed theo class chuẩn

Dùng để chuẩn hóa dữ liệu đầu vào trước khi trích xuất đặc trưng và train model.
"""


import os
import random
import numpy as np
import soundfile as sf
import librosa
from tqdm import tqdm

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

TARGET_SR = 22050        # Chuẩn hóa sample rate
SEED = 42
random.seed(SEED)

CLASS_MAP = {
    "Airplane":   "airplane",
    "Bics":       "bicycle",
    "Bus":        "bus",
    "Cars":       "car",
    "Helicopter": "helicopter",
    "Motocycles": "motorcycle",
    "Train":      "train",
    "Truck":      "truck",
}


total_ok = 0
total_err = 0

for src_name, dst_name in CLASS_MAP.items():
    src_path = os.path.join(RAW_DIR, src_name)
    dst_path = os.path.join(PROCESSED_DIR, dst_name)
    os.makedirs(dst_path, exist_ok=True)

    all_files = [f for f in os.listdir(src_path) if f.lower().endswith('.wav')]

    ok = 0
    err = 0

    for fname in tqdm(all_files, desc=f"Processing {dst_name}"):
        src_file = os.path.join(src_path, fname)
        new_name = f"{dst_name}_{ok+1:03d}.wav"
        dst_file = os.path.join(dst_path, new_name)

        try:
            # Load + convert Mono + resample 22050Hz
            y, sr = librosa.load(src_file, sr=TARGET_SR, mono=True)

            # Normalize biên độ [-1, 1]
            if np.max(np.abs(y)) > 0:
                y = y / np.max(np.abs(y))

            sf.write(dst_file, y, TARGET_SR)
            ok += 1

        except Exception as e:
            print(f"\nLỗi {fname}: {e}")
            err += 1

    print(f"{dst_name}: {ok} files OK, {err} lỗi\n")
    total_ok += ok
    total_err += err

print(f"Hoàn thành! Tổng: {total_ok} files OK, {total_err} lỗi")
print(f"Lưu tại: {PROCESSED_DIR}")