"""
Tạo thêm nhiều ảnh từ 1 ảnh khuôn mặt đã crop.

Input:
dataset/processed/
├── 23IT087_DangThanCau/
│   ├── 23IT087_DangThanCau_0001.jpg
│   ├── 23IT087_DangThanCau_0002.jpg

Output:
dataset/augmented/
├── 23IT087_DangThanCau/
│   ├── 23IT087_DangThanCau_0001_orig.jpg
│   ├── 23IT087_DangThanCau_0001_aug_001.jpg
│   ├── 23IT087_DangThanCau_0001_aug_002.jpg
│   ├── ...
│   └── 23IT087_DangThanCau_0001_aug_200.jpg

Cách chạy:
python augment_dataset.py
"""

import random
import shutil
from pathlib import Path

import cv2
import numpy as np

from config_v2 import (
    PROCESSED_DATASET_DIR,
    SUPPORTED_IMAGE_EXTENSIONS,
)

from utils_v2 import (
    ensure_dirs,
    imread_unicode,
    imwrite_unicode,
    resize_face,
)


# =========================
# Cấu hình riêng cho augmentation
# =========================

BASE_DIR = Path(__file__).resolve().parent

AUGMENTED_DATASET_DIR = BASE_DIR / "dataset" / "augmented"

# Mỗi ảnh gốc sẽ tạo thêm 200 ảnh mới
AUGMENT_PER_IMAGE = 200

# Nếu True thì xóa dữ liệu augmented cũ trước khi tạo lại
CLEAR_OLD_AUGMENTED = True


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
# Tăng/giảm sáng, tương phản
# =========================

def adjust_brightness_contrast(img):
    """
    alpha: độ tương phản
    beta: độ sáng
    """
    alpha = random.uniform(0.75, 1.35)
    beta = random.randint(-40, 40)

    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


# =========================
# Xoay ảnh nhẹ
# =========================

def rotate_image(img):
    h, w = img.shape[:2]

    angle = random.uniform(-15, 15)
    center = (w // 2, h // 2)

    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv2.warpAffine(
        img,
        matrix,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REFLECT_101,
    )

    return rotated


# =========================
# Dịch ảnh nhẹ
# =========================

def translate_image(img):
    h, w = img.shape[:2]

    tx = random.randint(-10, 10)
    ty = random.randint(-10, 10)

    matrix = np.float32([
        [1, 0, tx],
        [0, 1, ty],
    ])

    shifted = cv2.warpAffine(
        img,
        matrix,
        (w, h),
        borderMode=cv2.BORDER_REFLECT_101,
    )

    return shifted


# =========================
# Zoom ảnh nhẹ
# =========================

def zoom_image(img):
    h, w = img.shape[:2]

    scale = random.uniform(0.9, 1.12)

    new_w = int(w * scale)
    new_h = int(h * scale)

    resized = cv2.resize(img, (new_w, new_h))

    if scale >= 1:
        x_start = max(0, (new_w - w) // 2)
        y_start = max(0, (new_h - h) // 2)
        cropped = resized[y_start:y_start + h, x_start:x_start + w]
        return cropped

    output = np.zeros_like(img)
    x_start = (w - new_w) // 2
    y_start = (h - new_h) // 2
    output[y_start:y_start + new_h, x_start:x_start + new_w] = resized

    return output


# =========================
# Thêm nhiễu nhẹ
# =========================

def add_noise(img):
    sigma = random.uniform(2, 10)

    noise = np.random.normal(0, sigma, img.shape).astype(np.float32)

    noisy = img.astype(np.float32) + noise
    noisy = np.clip(noisy, 0, 255).astype(np.uint8)

    return noisy


# =========================
# Làm mờ nhẹ
# =========================

def blur_image(img):
    kernel_size = random.choice([3, 5])

    return cv2.GaussianBlur(img, (kernel_size, kernel_size), 0)


# =========================
# Làm sắc nét nhẹ
# =========================

def sharpen_image(img):
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0],
    ])

    return cv2.filter2D(img, -1, kernel)


# =========================
# Che nhẹ một vùng nhỏ
# =========================

def random_occlusion(img):
    output = img.copy()

    h, w = output.shape[:2]

    box_w = random.randint(int(w * 0.08), int(w * 0.18))
    box_h = random.randint(int(h * 0.08), int(h * 0.18))

    x1 = random.randint(0, max(1, w - box_w))
    y1 = random.randint(0, max(1, h - box_h))

    color = random.randint(80, 180)

    output[y1:y1 + box_h, x1:x1 + box_w] = color

    return output


# =========================
# Tạo 1 ảnh augmented ngẫu nhiên
# =========================

def random_augment(img):
    output = img.copy()

    # Lật ngang
    if random.random() < 0.4:
        output = cv2.flip(output, 1)

    # Xoay nhẹ
    if random.random() < 0.95:
        output = rotate_image(output)

    # Dịch ảnh nhẹ
    if random.random() < 0.85:
        output = translate_image(output)

    # Zoom nhẹ
    if random.random() < 0.7:
        output = zoom_image(output)

    # Tăng/giảm sáng, tương phản
    if random.random() < 0.95:
        output = adjust_brightness_contrast(output)

    # Thêm nhiễu
    if random.random() < 0.45:
        output = add_noise(output)

    # Blur nhẹ
    if random.random() < 0.25:
        output = blur_image(output)

    # Làm sắc nét nhẹ
    if random.random() < 0.25:
        output = sharpen_image(output)

    # Che nhẹ một vùng nhỏ
    if random.random() < 0.15:
        output = random_occlusion(output)

    output = resize_face(output)

    return output


# =========================
# Main augmentation
# =========================

def augment_dataset():
    ensure_dirs(PROCESSED_DATASET_DIR, AUGMENTED_DATASET_DIR)

    if CLEAR_OLD_AUGMENTED:
        clear_folder(AUGMENTED_DATASET_DIR)

    person_dirs = [
        p for p in Path(PROCESSED_DATASET_DIR).iterdir()
        if p.is_dir()
    ]

    if not person_dirs:
        print(f"Chưa có dữ liệu trong: {PROCESSED_DATASET_DIR}")
        print("Hãy chạy trước:")
        print("python prepare_dataset.py")
        return

    total_original = 0
    total_augmented = 0
    total_saved = 0

    for person_dir in person_dirs:
        label = person_dir.name

        output_dir = Path(AUGMENTED_DATASET_DIR) / label
        ensure_dirs(output_dir)

        image_paths = [
            p for p in person_dir.rglob("*")
            if p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]

        print(f"\nĐang tạo thêm ảnh cho: {label}")
        print(f"Số ảnh processed: {len(image_paths)}")
        print(f"Mỗi ảnh sẽ tạo thêm: {AUGMENT_PER_IMAGE} ảnh")

        saved_count = 0

        for idx, img_path in enumerate(image_paths, start=1):
            img = imread_unicode(img_path)

            if img is None:
                print(f"  [SKIP] Không đọc được ảnh: {img_path}")
                continue

            img = resize_face(img)

            if img is None:
                print(f"  [SKIP] Resize lỗi: {img_path}")
                continue

            # Lưu lại ảnh gốc đã crop
            original_path = output_dir / f"{label}_{idx:04d}_orig.jpg"

            if imwrite_unicode(original_path, img):
                saved_count += 1
                total_original += 1
                total_saved += 1

            # Tạo thêm 200 ảnh mới từ ảnh gốc
            for aug_idx in range(1, AUGMENT_PER_IMAGE + 1):
                aug_img = random_augment(img)

                out_path = output_dir / f"{label}_{idx:04d}_aug_{aug_idx:03d}.jpg"

                if imwrite_unicode(out_path, aug_img):
                    saved_count += 1
                    total_augmented += 1
                    total_saved += 1

        print(f"  [OK] {label}: đã tạo {saved_count} ảnh")

    print("\n========== KẾT QUẢ AUGMENT DATASET ==========")
    print(f"Tổng ảnh gốc đã copy: {total_original}")
    print(f"Tổng ảnh tạo thêm: {total_augmented}")
    print(f"Tổng ảnh trong augmented: {total_saved}")
    print(f"Output: {Path(AUGMENTED_DATASET_DIR).resolve()}")


if __name__ == "__main__":
    augment_dataset()