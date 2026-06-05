"""
Trích xuất embedding khuôn mặt để train SVM.

Ưu tiên đọc dữ liệu theo thứ tự:

1. dataset/split/train      -> nếu bạn đã chạy split_dataset.py
2. dataset/augmented        -> nếu bạn đã chạy augment_dataset.py
3. dataset/processed        -> nếu bạn chỉ mới chạy prepare_dataset.py

Cách chạy:
python extract_embeddings.py

Kết quả:
dataset/embeddings/face_embeddings.npz
"""

import numpy as np
from pathlib import Path
from deepface import DeepFace

from config_v2 import (
    PROCESSED_DATASET_DIR,
    EMBEDDINGS_DIR,
    EMBEDDINGS_FILE,
    FACE_RECOGNITION_MODEL,
    SUPPORTED_IMAGE_EXTENSIONS,
    MIN_IMAGES_PER_PERSON,
)

from utils_v2 import ensure_dirs, imread_unicode


# =========================
# Cấu hình đường dẫn bổ sung
# =========================

BASE_DIR = Path(__file__).resolve().parent

AUGMENTED_DATASET_DIR = BASE_DIR / "dataset" / "augmented"
SPLIT_TRAIN_DATASET_DIR = BASE_DIR / "dataset" / "split" / "train"


# =========================
# Kiểm tra thư mục có ảnh hay không
# =========================

def has_images(dataset_dir):
    dataset_dir = Path(dataset_dir)

    if not dataset_dir.exists():
        return False

    person_dirs = [p for p in dataset_dir.iterdir() if p.is_dir()]

    if not person_dirs:
        return False

    for person_dir in person_dirs:
        image_paths = [
            p for p in person_dir.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]

        if image_paths:
            return True

    return False


# =========================
# Chọn dataset source đúng
# =========================

def get_dataset_source_dir():
    """
    Ưu tiên:
    1. dataset/split/train
    2. dataset/augmented
    3. dataset/processed
    """

    if has_images(SPLIT_TRAIN_DATASET_DIR):
        print("[INFO] Đang dùng dữ liệu TRAIN đã chia:")
        print(SPLIT_TRAIN_DATASET_DIR)
        return SPLIT_TRAIN_DATASET_DIR

    if has_images(AUGMENTED_DATASET_DIR):
        print("[INFO] Đang dùng dữ liệu đã nhân ảnh AUGMENTED:")
        print(AUGMENTED_DATASET_DIR)
        return AUGMENTED_DATASET_DIR

    if has_images(PROCESSED_DATASET_DIR):
        print("[INFO] Đang dùng dữ liệu PROCESSED:")
        print(PROCESSED_DATASET_DIR)
        return Path(PROCESSED_DATASET_DIR)

    return None


# =========================
# Trích xuất embedding từ 1 ảnh
# =========================

def extract_embedding(image):
    try:
        reps = DeepFace.represent(
            img_path=image,
            model_name=FACE_RECOGNITION_MODEL,
            detector_backend="skip",
            enforce_detection=False,
            align=False,
        )

        if not reps:
            return None

        return np.array(reps[0]["embedding"], dtype=np.float32)

    except Exception as e:
        print("  [ERROR] Lỗi DeepFace:", e)
        return None


# =========================
# Main extract
# =========================

def extract_embeddings():
    ensure_dirs(EMBEDDINGS_DIR)

    dataset_source_dir = get_dataset_source_dir()

    if dataset_source_dir is None:
        print("[ERROR] Không tìm thấy dữ liệu ảnh hợp lệ.")
        print("Hãy chạy theo thứ tự:")
        print("python prepare_dataset.py")
        print("python augment_dataset.py")
        print("python split_dataset.py")
        return

    person_dirs = [
        p for p in Path(dataset_source_dir).iterdir()
        if p.is_dir()
    ]

    if not person_dirs:
        print(f"Chưa có dữ liệu trong: {dataset_source_dir}")
        return

    X = []
    y = []

    total_images = 0
    total_embeddings = 0

    print("\n========== TRÍCH XUẤT EMBEDDINGS ==========")
    print(f"Input : {Path(dataset_source_dir).resolve()}")
    print(f"Output: {Path(EMBEDDINGS_FILE).resolve()}")
    print("===========================================")

    for person_dir in person_dirs:
        label = person_dir.name

        image_paths = [
            p for p in person_dir.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]

        total_images += len(image_paths)

        if len(image_paths) < MIN_IMAGES_PER_PERSON:
            print(
                f"[WARN] {label} chỉ có {len(image_paths)} ảnh, "
                f"nên có ít nhất {MIN_IMAGES_PER_PERSON} ảnh."
            )

        print(f"\nĐang trích xuất embedding cho {label}: {len(image_paths)} ảnh")

        ok_count = 0
        skip_count = 0

        for img_path in image_paths:
            img = imread_unicode(img_path)

            if img is None:
                print(f"  [SKIP] Không đọc được ảnh: {img_path}")
                skip_count += 1
                continue

            emb = extract_embedding(img)

            if emb is None:
                print(f"  [SKIP] Không trích xuất được embedding: {img_path.name}")
                skip_count += 1
                continue

            X.append(emb)
            y.append(label)

            ok_count += 1
            total_embeddings += 1

        print(f"  [OK] {label}: {ok_count} embedding, bỏ qua {skip_count}")

    if not X:
        print("\n[ERROR] Không có embedding nào được tạo.")
        return

    X = np.array(X, dtype=np.float32)
    y = np.array(y)

    np.savez_compressed(EMBEDDINGS_FILE, X=X, y=y)

    print("\n========== KẾT QUẢ EXTRACT EMBEDDING ==========")
    print(f"Tổng ảnh đọc được      : {total_images}")
    print(f"Tổng embedding tạo được: {total_embeddings}")
    print("X shape:", X.shape)
    print("y shape:", y.shape)
    print("Đã lưu:", EMBEDDINGS_FILE)
    print("===============================================")


if __name__ == "__main__":
    extract_embeddings()