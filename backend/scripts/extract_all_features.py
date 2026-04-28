"""
Chạy 1 lần để build index toàn bộ dataset.
Đọc data/processed/ → extract feature → upsert vào Qdrant.

Usage:
    python -m backend.scripts.extract_all_features
    python -m backend.scripts.extract_all_features --recreate   # xóa index cũ và build lại
"""

import sys
import argparse
import librosa
import numpy as np
from pathlib import Path
from tqdm import tqdm

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from backend.features.extractor import extract_features
from backend.db.collection      import init_collection
from backend.db.writer          import upsert_batch
from backend.db.search          import build_payload

PROCESSED_DIR = BASE_DIR / "data" / "processed"
CLASS_FOLDERS = [
    "airplane", "bicycle", "bus", "car",
    "helicopter", "motorcycle", "train", "truck",
]


def collect_files() -> list[Path]:
    """Thu thập toàn bộ file .wav từ processed/."""
    files = []
    for cls in CLASS_FOLDERS:
        folder = PROCESSED_DIR / cls
        if not folder.exists():
            print(f"[WARN] Không tìm thấy thư mục: {folder}")
            continue
        wavs = sorted(folder.glob("*.wav"))
        print(f"  {cls:<12}: {len(wavs)} files")
        files.extend(wavs)
    return files


def main(recreate: bool = False):
    print("=" * 50)
    print("Build Qdrant index")
    print("=" * 50)

    # 1. Init collection
    print("\n[1] Khởi tạo collection...")
    init_collection(recreate=recreate)

    # 2. Thu thập file
    print("\n[2] Quét dataset...")
    all_files = collect_files()
    print(f"\n  Tổng cộng: {len(all_files)} files")

    if len(all_files) == 0:
        print("[ERROR] Không tìm thấy file nào. Kiểm tra data/processed/")
        return

    # 3. Extract feature từng file
    print("\n[3] Trích xuất đặc trưng...")
    ids, vectors, payloads = [], [], []
    errors = []

    for point_id, filepath in enumerate(tqdm(all_files, desc="Extracting"), start=1):
        try:
            # Extract
            vector, meta = extract_features(filepath)

            # Lấy duration thực tế
            duration = librosa.get_duration(path=str(filepath))

            # Class label = tên thư mục cha
            class_label = filepath.parent.name

            payload = build_payload(
                filename    = filepath.name,
                class_label = class_label,
                file_path   = str(filepath.relative_to(BASE_DIR)),
                duration_sec= duration,
                sample_rate = 22050,
                meta        = meta,
            )

            ids.append(point_id)
            vectors.append(vector)
            payloads.append(payload)

        except Exception as e:
            errors.append((filepath.name, str(e)))
            tqdm.write(f"[ERROR] {filepath.name}: {e}")

    # 4. Upsert vào Qdrant
    print(f"\n[4] Upsert {len(ids)} points vào Qdrant...")
    if ids:
        upsert_batch(
            ids      = ids,
            vectors  = np.stack(vectors),
            payloads = payloads,
        )

    # 5. Báo cáo
    print("\n" + "=" * 50)
    print(f"Hoàn thành!")
    print(f"  Thành công : {len(ids)} files")
    print(f"  Lỗi       : {len(errors)} files")
    if errors:
        print("  Danh sách lỗi:")
        for fname, err in errors:
            print(f"    {fname}: {err}")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--recreate", action="store_true",
        help="Xóa index cũ và build lại từ đầu"
    )
    args = parser.parse_args()
    main(recreate=args.recreate)