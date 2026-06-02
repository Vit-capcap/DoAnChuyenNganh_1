import cv2
from pathlib import Path
from ultralytics import YOLO

from config_v2 import (
    RAW_DATASET_DIR,
    PROCESSED_DATASET_DIR,
    YOLO_FACE_MODEL,
    SUPPORTED_IMAGE_EXTENSIONS,
)
from utils_v2 import (
    ensure_dirs,
    imread_unicode,
    imwrite_unicode,
    crop_face_with_margin,
    resize_face,
)


def prepare_dataset():
    ensure_dirs(RAW_DATASET_DIR, PROCESSED_DATASET_DIR)

    if not Path(YOLO_FACE_MODEL).exists():
        raise FileNotFoundError(f"Không tìm thấy YOLO model: {YOLO_FACE_MODEL}")

    detector = YOLO(str(YOLO_FACE_MODEL))

    person_dirs = [p for p in Path(RAW_DATASET_DIR).iterdir() if p.is_dir()]
    if not person_dirs:
        print(f"Chưa có dữ liệu trong: {RAW_DATASET_DIR}")
        print("Hãy tạo dạng: dataset/raw/<student_code>/*.jpg")
        return

    total_saved = 0

    for person_dir in person_dirs:
        label = person_dir.name
        output_dir = Path(PROCESSED_DATASET_DIR) / label
        ensure_dirs(output_dir)

        image_paths = [
            p for p in person_dir.rglob("*")
            if p.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
        ]

        print(f"\nĐang xử lý {label}: {len(image_paths)} ảnh")

        saved_count = 0

        for idx, img_path in enumerate(image_paths, start=1):
            img = imread_unicode(img_path)
            if img is None:
                print(f"  [SKIP] Không đọc được ảnh: {img_path}")
                continue

            results = detector(img, verbose=False)

            boxes = []
            for r in results:
                for b in r.boxes:
                    x1, y1, x2, y2 = map(int, b.xyxy[0])
                    conf = float(b.conf[0]) if b.conf is not None else 0.0
                    boxes.append((x1, y1, x2, y2, conf))

            if not boxes:
                print(f"  [SKIP] Không tìm thấy mặt: {img_path.name}")
                continue

            # Chọn mặt lớn nhất trong ảnh.
            boxes.sort(key=lambda box: (box[2] - box[0]) * (box[3] - box[1]), reverse=True)
            x1, y1, x2, y2, conf = boxes[0]

            face = crop_face_with_margin(img, (x1, y1, x2, y2))
            face = resize_face(face)

            if face is None:
                print(f"  [SKIP] Crop lỗi: {img_path.name}")
                continue

            out_path = output_dir / f"{label}_{idx:04d}.jpg"
            imwrite_unicode(out_path, face)

            saved_count += 1
            total_saved += 1

        print(f"  [OK] Đã lưu {saved_count} ảnh processed cho {label}")

    print(f"\nHoàn thành. Tổng ảnh processed: {total_saved}")


if __name__ == "__main__":
    prepare_dataset()
