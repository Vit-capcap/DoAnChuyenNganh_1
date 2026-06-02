import os
import cv2
import json
import base64
import numpy as np
from pathlib import Path
from datetime import datetime

from config_v2 import (
    FACE_IMAGE_SIZE,
    FACE_MARGIN_X_RATIO,
    FACE_MARGIN_Y_RATIO,
)


def ensure_dirs(*dirs):
    """Tạo thư mục nếu chưa tồn tại."""
    for d in dirs:
        Path(d).mkdir(parents=True, exist_ok=True)


def imread_unicode(path):
    """
    Đọc ảnh hỗ trợ đường dẫn Unicode trên Windows.
    """
    path = str(path)
    data = np.fromfile(path, dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def imwrite_unicode(path, image):
    """
    Ghi ảnh hỗ trợ đường dẫn Unicode trên Windows.
    """
    path = str(path)
    ext = os.path.splitext(path)[1] or ".jpg"
    ok, encoded = cv2.imencode(ext, image)
    if not ok:
        return False
    encoded.tofile(path)
    return True


def crop_face_with_margin(img, box):
    """
    Crop mặt có margin để realtime giống lúc train.
    box: (x1, y1, x2, y2)
    """
    if img is None:
        return None

    x1, y1, x2, y2 = map(int, box)
    h, w = img.shape[:2]

    box_w = max(1, x2 - x1)
    box_h = max(1, y2 - y1)

    margin_x = int(box_w * FACE_MARGIN_X_RATIO)
    margin_y = int(box_h * FACE_MARGIN_Y_RATIO)

    x1m = max(0, x1 - margin_x)
    y1m = max(0, y1 - margin_y)
    x2m = min(w, x2 + margin_x)
    y2m = min(h, y2 + margin_y)

    face_crop = img[y1m:y2m, x1m:x2m]

    if face_crop is None or face_crop.size == 0:
        return None

    return face_crop


def resize_face(face_img):
    """Resize ảnh mặt về kích thước thống nhất."""
    if face_img is None or face_img.size == 0:
        return None
    return cv2.resize(face_img, FACE_IMAGE_SIZE)


def draw_face_box(frame, x1, y1, x2, y2, label="Unknown", confidence=0.0):
    """Vẽ khung mặt lên frame."""
    if frame is None:
        return

    color = (0, 200, 0) if label != "Unknown" else (0, 0, 255)
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    text = f"{label} ({confidence:.2f})"
    y_text = max(20, y1 - 10)

    cv2.rectangle(frame, (x1, y_text - 22), (x1 + max(180, len(text) * 11), y_text + 5), color, -1)
    cv2.putText(
        frame,
        text,
        (x1 + 5, y_text),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )


def image_to_base64(image):
    """Chuyển OpenCV image sang base64 jpg."""
    ok, buffer = cv2.imencode(".jpg", image)
    if not ok:
        return None
    return base64.b64encode(buffer).decode("utf-8")


def base64_to_image(image_base64):
    """
    Chuyển base64 từ frontend thành OpenCV image.
    Hỗ trợ cả chuỗi có prefix: data:image/jpeg;base64,...
    """
    if not image_base64:
        return None

    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(image_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


def now_string():
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def json_dumps_safe(data):
    return json.dumps(data, ensure_ascii=False, default=str)


def get_attendance_status_by_time():
    """
    Quy tắc đơn giản:
    - Nếu sinh viên được nhận diện thì PRESENT.
    - Bạn có thể mở rộng: nếu check_in_time sau start_time + 15 phút thì LATE.
    """
    return "PRESENT"
