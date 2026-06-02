"""
Test camera + model realtime trên máy local.

Chạy:
python test_camera.py

Nhấn ESC để thoát.
"""

import cv2
import time
import joblib
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from deepface import DeepFace

from config_v2 import (
    YOLO_FACE_MODEL,
    SVM_MODEL_PATH,
    LABEL_ENCODER_PATH,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    FACE_RECOGNITION_MODEL,
    PREDICT_PROBA_THRESHOLD,
)
from utils_v2 import crop_face_with_margin, resize_face, draw_face_box


def extract_embedding(face_img):
    try:
        face_img = resize_face(face_img)

        reps = DeepFace.represent(
            img_path=face_img,
            model_name=FACE_RECOGNITION_MODEL,
            detector_backend="skip",
            enforce_detection=False,
            align=False,
        )

        if not reps:
            return None

        return np.array(reps[0]["embedding"], dtype=np.float32).reshape(1, -1)

    except Exception as e:
        print("[ERROR] extract embedding:", e)
        return None


def main():
    if not Path(YOLO_FACE_MODEL).exists():
        print("Không tìm thấy YOLO model:", YOLO_FACE_MODEL)
        return

    if not Path(SVM_MODEL_PATH).exists() or not Path(LABEL_ENCODER_PATH).exists():
        print("Chưa có model SVM hoặc label encoder.")
        print("Hãy chạy:")
        print("python prepare_dataset.py")
        print("python extract_embeddings.py")
        print("python train_face_model.py")
        return

    detector = YOLO(str(YOLO_FACE_MODEL))
    model = joblib.load(SVM_MODEL_PATH)
    encoder = joblib.load(LABEL_ENCODER_PATH)

    print("Đã load model.")
    print("Classes:", encoder.classes_)

    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    if not cap.isOpened():
        print("Không mở được camera.")
        return

    last_print = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Không đọc được camera.")
            break

        results = detector(frame, verbose=False)

        for r in results:
            for b in r.boxes:
                x1, y1, x2, y2 = map(int, b.xyxy[0])

                face = crop_face_with_margin(frame, (x1, y1, x2, y2))
                if face is None:
                    draw_face_box(frame, x1, y1, x2, y2, "Bad crop", 0)
                    continue

                emb = extract_embedding(face)
                if emb is None:
                    draw_face_box(frame, x1, y1, x2, y2, "Unknown", 0)
                    continue

                probs = model.predict_proba(emb)[0]
                best_idx = int(np.argmax(probs))
                confidence = float(probs[best_idx])
                label = str(encoder.inverse_transform([best_idx])[0])

                if confidence < PREDICT_PROBA_THRESHOLD:
                    show_label = "Unknown"
                else:
                    show_label = label

                if time.time() - last_print > 1:
                    top3_idx = np.argsort(probs)[-3:][::-1]
                    top3 = [
                        (str(encoder.inverse_transform([int(i)])[0]), float(probs[int(i)]))
                        for i in top3_idx
                    ]
                    print("Top 3:", top3)
                    last_print = time.time()

                draw_face_box(frame, x1, y1, x2, y2, show_label, confidence)

        cv2.imshow("Face Recognition Test", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
