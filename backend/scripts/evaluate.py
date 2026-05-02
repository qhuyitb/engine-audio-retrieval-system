"""
Đánh giá độ chính xác hệ thống retrieval.

Metric:
- Precision@K : trong top-K kết quả, bao nhiêu % đúng class với query
- Recall@K    : trong top-K kết quả, capture được bao nhiêu % relevant files
- MAP@K       : Mean Average Precision — đánh giá tổng thể ranking

Cách đánh giá:
    Với mỗi file trong dataset làm query → tìm top-K
    → so sánh class của kết quả với class của query
    → tính metric trung bình toàn dataset

Usage:
    python -m backend.scripts.evaluate
    python -m backend.scripts.evaluate --k 5 --sample 100
"""

import sys
import argparse
import random
import numpy as np
from pathlib import Path
from tqdm import tqdm
from collections import defaultdict
import json


BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from backend.search.retrieval import retrieve
from backend.db.reader import get_all_points

PROCESSED_DIR = BASE_DIR / "data" / "processed"
CLASS_FOLDERS = [
    "airplane", "bicycle", "bus", "car",
    "helicopter", "motorcycle", "train", "truck",
]


def precision_at_k(results: list[dict], query_class: str, k: int) -> float:
    """
    Precision@K = số kết quả đúng class trong top-K / K
    Không tính file query chính nó (score=1.0, rank=1).
    """
    # Bỏ rank 1 nếu là chính file đó (score = 1.0)
    filtered = [r for r in results if r["score"] < 0.9999][:k]
    if not filtered:
        return 0.0
    correct = sum(1 for r in filtered if r["class_label"] == query_class)
    return correct / len(filtered)


def average_precision_at_k(results: list[dict], query_class: str, k: int) -> float:
    """
    Average Precision@K — tính precision tại mỗi vị trí có hit đúng class.
    AP = (1/R) * sum(P@i * rel(i))
    R = tổng số relevant items trong top-K
    """
    filtered = [r for r in results if r["score"] < 0.9999][:k]
    if not filtered:
        return 0.0

    hits = 0
    sum_precision = 0.0
    for i, r in enumerate(filtered, start=1):
        if r["class_label"] == query_class:
            hits += 1
            sum_precision += hits / i

    if hits == 0:
        return 0.0
    return sum_precision / hits


def recall_at_k(results: list[dict], query_class: str, k: int, total_relevant: int) -> float:
    """
    Recall@K = số kết quả đúng class trong top-K / tổng số file cùng class trong DB
    total_relevant = số file cùng class trong DB (không tính chính file query)
    """
    filtered = [r for r in results if r["score"] < 0.9999][:k]
    correct = sum(1 for r in filtered if r["class_label"] == query_class)
    return correct / total_relevant if total_relevant > 0 else 0.0


def collect_query_files(sample: int | None = None) -> list[tuple[Path, str]]:
    """
    Thu thập file query từ processed dataset.
    Trả list of (filepath, class_label).
    sample: nếu set, lấy ngẫu nhiên sample files mỗi class.
    """
    query_files = []
    for cls in CLASS_FOLDERS:
        folder = PROCESSED_DIR / cls
        if not folder.exists():
            continue
        wavs = sorted(folder.glob("*.wav"))
        if sample:
            wavs = random.sample(wavs, min(sample, len(wavs)))
        for wav in wavs:
            query_files.append((wav, cls))
    return query_files


def main(k: int = 5, sample: int | None = None, seed: int = 42):
    random.seed(seed)

    print("=" * 60)
    print(f"Evaluation — Precision/Recall/MAP @ K={k}")
    if sample:
        print(f"Sample mode: {sample} files/class")
    print("=" * 60)

    # Đếm số file mỗi class trong DB (để tính recall)
    all_points = get_all_points()
    class_counts = defaultdict(int)
    for p in all_points:
        class_counts[p["class_label"]] += 1

    # Thu thập query files
    query_files = collect_query_files(sample=sample)
    print(f"\nTổng query files: {len(query_files)}")
    print(f"Evaluating top-{k}...\n")

    # Metrics per class
    class_metrics = defaultdict(lambda: {
        "precision": [], "recall": [], "ap": [], "count": 0
    })

    errors = 0
    for filepath, cls in tqdm(query_files, desc="Evaluating"):
        try:
            result  = retrieve(filepath, top_k=k + 1)  # +1 để bỏ chính nó
            results = result["results"]

            # total_relevant = số file cùng class trong DB - 1 (bỏ chính nó)
            total_relevant = class_counts[cls] - 1

            p_at_k = precision_at_k(results, cls, k)
            r_at_k = recall_at_k(results, cls, k, total_relevant)
            ap     = average_precision_at_k(results, cls, k)

            class_metrics[cls]["precision"].append(p_at_k)
            class_metrics[cls]["recall"].append(r_at_k)
            class_metrics[cls]["ap"].append(ap)
            class_metrics[cls]["count"] += 1

        except Exception as e:
            tqdm.write(f"[ERROR] {filepath.name}: {e}")
            errors += 1

    # ── In kết quả ────────────────────────────────────────────────────────────
    print(f"\n{'Class':<12} {'P@'+str(k):<10} {'R@'+str(k):<10} {'AP@'+str(k):<10} {'Files'}")
    print("-" * 55)

    all_p, all_r, all_ap = [], [], []
    for cls in CLASS_FOLDERS:
        if cls not in class_metrics:
            continue
        m   = class_metrics[cls]
        p   = np.mean(m["precision"])
        r   = np.mean(m["recall"])
        ap  = np.mean(m["ap"])
        cnt = m["count"]

        all_p.append(p)
        all_r.append(r)
        all_ap.append(ap)

        print(f"{cls:<12} {p:<10.4f} {r:<10.4f} {ap:<10.4f} {cnt}")

    print("-" * 55)
    print(
        f"{'MEAN':<12} "
        f"{np.mean(all_p):<10.4f} "
        f"{np.mean(all_r):<10.4f} "
        f"{np.mean(all_ap):<10.4f} "
        f"{len(query_files) - errors}"
    )
    print(f"\nErrors: {errors}")
    print("=" * 60)

    # Lưu kết quả ra file để dùng trong notebook
    results_data = {
        "k"           : k,
        "sample"      : sample,
        "class_metrics": {
            cls: {
                "precision_at_k": float(np.mean(m["precision"])),
                "recall_at_k"   : float(np.mean(m["recall"])),
                "map_at_k"      : float(np.mean(m["ap"])),
                "count"         : m["count"],
            }
            for cls, m in class_metrics.items()
        },
        "overall": {
            "precision_at_k": float(np.mean(all_p)),
            "recall_at_k"   : float(np.mean(all_r)),
            "map_at_k"      : float(np.mean(all_ap)),
            "total_queries" : len(query_files) - errors,
            "errors"        : errors,
        }
    }

    out_path = BASE_DIR / "data" / "metadata" / f"eval_results_k{k}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(results_data, f, indent=2)
    print(f"\nLưu kết quả tại: {out_path}")

    return results_data



def compute_confusion_matrix(k: int = 5, sample: int | None = None, seed: int = 42):
    """
    Tính confusion matrix — xem class nào hay bị nhầm với class nào.
    
    Cách tính:
        Với mỗi file query → lấy top-K kết quả (bỏ chính nó)
        → đếm class của từng kết quả
        → confusion[true_class][predicted_class] += count
    
    Kết quả: ma trận 8×8, hàng = class query, cột = class kết quả
    """
    import random
    random.seed(seed)

    print("=" * 60)
    print(f"Confusion Matrix @ K={k}")
    print("=" * 60)

    classes = ["airplane", "bicycle", "bus", "car",
               "helicopter", "motorcycle", "train", "truck"]

    # Ma trận đếm — confusion[true][pred] = số lần xuất hiện
    confusion = defaultdict(lambda: defaultdict(int))

    query_files = collect_query_files(sample=sample)

    for filepath, true_class in tqdm(query_files, desc="Building confusion matrix"):
        try:
            result  = retrieve(filepath, top_k=k + 1)
            results = result["results"]
            # Bỏ chính file query (score ≈ 1.0)
            filtered = [r for r in results if r["score"] < 0.9999][:k]

            for r in filtered:
                confusion[true_class][r["class_label"]] += 1

        except Exception as e:
            tqdm.write(f"[ERROR] {filepath.name}: {e}")

    # ── Normalize theo hàng → tỉ lệ % ────────────────────────────────────
    confusion_pct = defaultdict(dict)
    for true_cls in classes:
        total = sum(confusion[true_cls].values())
        for pred_cls in classes:
            count = confusion[true_cls].get(pred_cls, 0)
            confusion_pct[true_cls][pred_cls] = round(count / total * 100, 1) if total > 0 else 0.0

    # ── In ra terminal ─────────────────────────────────────────────────────
    short = {
        "airplane": "plane", "bicycle": "bike", "bus": "bus",
        "car": "car", "helicopter": "heli", "motorcycle": "moto",
        "train": "train", "truck": "truck",
    }
    header = f"{'':>10}" + "".join(f"{short[c]:>8}" for c in classes)
    print(f"\n{header}")
    print("-" * (10 + 8 * len(classes)))

    for true_cls in classes:
        row = f"{short[true_cls]:>10}"
        for pred_cls in classes:
            val = confusion_pct[true_cls][pred_cls]
            # Highlight diagonal (đúng class)
            if true_cls == pred_cls:
                row += f"[{val:>5.1f}]"
            else:
                row += f" {val:>5.1f} "
        print(row)

    # ── Lưu JSON ──────────────────────────────────────────────────────────
    output = {
        "k": k,
        "classes": classes,
        "matrix_pct": {
            true_cls: {pred_cls: confusion_pct[true_cls][pred_cls] for pred_cls in classes}
            for true_cls in classes
        },
        "matrix_count": {
            true_cls: {pred_cls: confusion[true_cls].get(pred_cls, 0) for pred_cls in classes}
            for true_cls in classes
        },
        # Top nhầm lẫn nhiều nhất
        "top_confusions": _get_top_confusions(confusion_pct, classes, top_n=5),
    }

    out_path = BASE_DIR / "data" / "metadata" / f"confusion_matrix_k{k}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nTop nhầm lẫn:")
    for item in output["top_confusions"]:
        print(f"  {item['true_class']:>12} → {item['pred_class']:<12} {item['pct']}%")

    print(f"\nLưu tại: {out_path}")
    return output


def _get_top_confusions(confusion_pct, classes, top_n=5):
    """Lấy top N cặp (true_class, pred_class) bị nhầm nhiều nhất."""
    pairs = []
    for true_cls in classes:
        for pred_cls in classes:
            if true_cls == pred_cls:
                continue
            pct = confusion_pct[true_cls][pred_cls]
            if pct > 0:
                pairs.append({
                    "true_class": true_cls,
                    "pred_class": pred_cls,
                    "pct": pct,
                })
    return sorted(pairs, key=lambda x: x["pct"], reverse=True)[:top_n]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--k",         type=int,  default=5,    help="Top-K")
    parser.add_argument("--sample",    type=int,  default=None, help="Files/class để evaluate")
    parser.add_argument("--confusion", action="store_true",     help="Tính confusion matrix")
    args = parser.parse_args()

    if args.confusion:
        compute_confusion_matrix(k=args.k, sample=args.sample)
    else:
        main(k=args.k, sample=args.sample)