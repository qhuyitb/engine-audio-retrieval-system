"""
Script kiểm tra nhanh dataset audio:
- Đếm số file .wav trong từng thư mục class
- Lấy sample rate (SR), số kênh (mono/stereo)
- Tính thời lượng (giây) của file mẫu

Dùng để verify dữ liệu raw hoặc processed trước khi train.
"""


import os
import librosa

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
# PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")  # check lại process khi đã preprocess_audio.py


CLASS_FOLDERS = ["Airplane", "Bics", "Bus", "Cars", "Helicopter", "Motocycles", "Train", "Truck"] # raw dùng tên này
# CLASS_FOLDERS = ["airplane", "bicycle", "bus", "car", "helicopter", "motorcycle", "train", "truck"] # processed dùng tên này

print(f"{'Folder':<12} {'Files':>6} {'SR':>8} {'Channels':>10} {'Duration(s)':>12}")
print("-" * 55)

for folder in CLASS_FOLDERS:
    # folder_path = os.path.join(PROCESSED_DIR, folder)
    folder_path = os.path.join(RAW_DIR, folder)
    
    all_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.wav')]
    
    if not all_files:
        print(f"{folder:<12} {'0':>6}")
        continue

    sample_file = os.path.join(folder_path, all_files[0])
    y, sr = librosa.load(sample_file, sr=None, mono=False)
    
    channels = 1 if y.ndim == 1 else y.shape[0]
    duration = round(y.shape[-1] / sr, 2)
    
    print(f"{folder:<12} {len(all_files):>6} {sr:>8} {channels:>10} {duration:>12}")

