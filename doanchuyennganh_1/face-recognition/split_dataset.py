"""
Chia dataset ảnh khuôn mặt thành tập train và test.

Input:
dataset/augmented/
├── 23IT087_DangThanCau/
│   ├── 23IT087_DangThanCau_0001_orig.jpg
│   ├── 23IT087_DangThanCau_0001_aug_01.jpg
│   ├── 23IT087_DangThanCau_0001_aug_02.jpg

Output:
dataset/split/
├── train/
│   ├── 23IT087_DangThanCau/
│   │   ├── ...
│
├── test/
│   ├── 23IT087_DangThanCau/
│   │   ├── ...

Cách chạy:
python split_dataset.py
"""

import random
import shutil
from pathlib import Path

from config_v2 import (
    SUPPORTED_IMAGE_EXTENSIONS,
)

from utils_v2 import ensure_dirs


# =========================
# Cấu hình đường dẫn
# =========================

BASE_DIR = Path(__file__).resolve().parent

# Dữ liệu sau khi đã tạo thêm ảnh bằng augment_dataset.py
AUGMENTED_DATASET_DIR = BASE_DIR / "dataset" / "augmented"

# Thư mục output train/test
SPLIT_DATASET_DIR = BASE_DIR / "dataset" / "split"
TRAIN_DATASET_DIR = SPLIT_DATASET_DIR / "train"
TEST_DATASET_DIR = SPLIT_DATASET_DIR / "test"


# =========================
# Cấu hình chia dữ liệu
# =========================

# 0.2 nghĩa là 20% ảnh để test, 80% ảnh để train
TEST_SIZE = 0.2

# Nếu True thì xóa dữ liệu split cũ trước khi chia lại
CLEAR_OLD_SPLIT = True

# Seed để mỗi lần chia giữ ổn định, tránh chia ngẫu nhiên khác nhau liên tục
RANDOM_SEED = 42


# =========================
# Helper: Xóa thư mục cũ
# =========================

def clear_folder(folder_path):
    folder_path = Path(folder_path)

    if not folder_path.exists():
        folder_path.mkdir(parents=True, exist_ok=True)
        return

    for item in folder_path.iterdir():
        if item.name == ".gitkeep":
            continue

        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()


# =========================
# Helper: Copy danh sách file
# =========================

def copy_files(file_paths, output_dir):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    copied = 0

    for src_path in file_paths:
        dst_path = output_dir / src_path.name

        try:
            shutil.copy2(src_path, dst_path)
            copied += 1
        except Exception as e:
            print(f"[ERROR] Không thể copy file: {src_path}")
            print("Lỗi:", e)

    return copied


# =========================
# Main: Chia dataset
# =========================

def split_dataset():
    random.seed(RANDOM_SEED)

    ensure_dirs(
        AUGMENTED_DATASET_DIR,
        TRAIN_DATASET_DIR,
        TEST_DATASET_DIR,
    )

    if CLEAR_OLD_SPLIT:
        clear_folder(TRAIN_DATASET_DIR)
        clear_folder(TEST_DATASET_DIR)

    person_dirs = [
        p for p in Path(AUGMENTED_DATASET_DIR).iterdir()
        if p.is_dir()
    ]

    if not person_dirs:
        print(f"Chưa có dữ liệu trong: {AUGMENTED_DATASET_DIR}")
        print("Hãy chạy trước:")
        print("python prepare_dataset.py")
        print("python augment_dataset.py")
        return

    total_train = 0
    total_test = 0
    total_classes = 0

    print("========== CHIA DATASET TRAIN / TEST ==========")
    print(f"Input : {AUGMENTED_DATASET_DIR.resolve()}")
    print(f"Train : {TRAIN_DATASET_DIR.resolve()}")
    print(f"Test  : {TEST_DATASET_DIR.resolve()}")
    print(f"Tỷ lệ test: {int(TEST_SIZE * 100)}%")
    print("================================================")

    for person_dir in person_dirs:
        label = person_dir.name

        image_paths = [
            p for p in person_dir.rglob("*")
            if p.is_file() and p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]

        if not image_paths:
            print(f"[SKIP] {label}: không có ảnh hợp lệ")
            continue

        random.shuffle(image_paths)

        total_images = len(image_paths)

        if total_images == 1:
            # Nếu chỉ có 1 ảnh thì không thể chia test
            train_files = image_paths
            test_files = []
        else:
            test_count = int(total_images * TEST_SIZE)

            # Đảm bảo mỗi class có ít nhất 1 ảnh test nếu đủ ảnh
            test_count = max(1, test_count)

            # Đảm bảo vẫn còn ít nhất 1 ảnh train
            if test_count >= total_images:
                test_count = total_images - 1

            test_files = image_paths[:test_count]
            train_files = image_paths[test_count:]

        train_output_dir = TRAIN_DATASET_DIR / label
        test_output_dir = TEST_DATASET_DIR / label

        copied_train = copy_files(train_files, train_output_dir)
        copied_test = copy_files(test_files, test_output_dir)

        total_train += copied_train
        total_test += copied_test
        total_classes += 1

        print(
            f"[OK] {label}: "
            f"total={total_images}, "
            f"train={copied_train}, "
            f"test={copied_test}"
        )

    print("\n========== KẾT QUẢ CHIA DATASET ==========")
    print(f"Tổng class/người: {total_classes}")
    print(f"Tổng ảnh train : {total_train}")
    print(f"Tổng ảnh test  : {total_test}")
    print(f"Train folder   : {TRAIN_DATASET_DIR.resolve()}")
    print(f"Test folder    : {TEST_DATASET_DIR.resolve()}")
    print("==========================================")

    if total_classes < 2:
        print("\n[WARNING] Dataset hiện chỉ có 1 người/class.")
        print("SVM cần ít nhất 2 người để train nhận diện thật sự.")
        print("Bạn nên thêm ảnh của ít nhất 1 sinh viên khác.")


if __name__ == "__main__":
    split_dataset()