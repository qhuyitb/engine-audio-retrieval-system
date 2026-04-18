"""
Giới hạn mỗi lớp trong dataset còn tối đa 100 file .wav
bằng cách xóa ngẫu nhiên các file dư thừa.
"""

import os
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")

FILES_PER_CLASS = 100
SEED = 42
random.seed(SEED)

CLASS_FOLDERS = ["Airplane", "Bics", "Bus", "Cars", "Helicopter", "Motocycles", "Train", "Truck"]

for folder in CLASS_FOLDERS:
    folder_path = os.path.join(RAW_DIR, folder)

    all_files = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith(('.wav'))
    ]

    print(f"{folder}: {len(all_files)} files", end="")

    if len(all_files) <= FILES_PER_CLASS:
        print(f"giữ nguyên")
        continue

    # Chọn file cần XÓA
    to_delete = random.sample(all_files, len(all_files) - FILES_PER_CLASS)

    for fname in to_delete:
        os.remove(os.path.join(folder_path, fname))

    print(f"xóa {len(to_delete)}, còn lại 100 files")
