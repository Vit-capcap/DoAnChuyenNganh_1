import base64
import cv2
import joblib
import numpy as np
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from deepface import DeepFace

from config_v2 import (
    YOLO_FACE_MODEL,
    SVM_MODEL_PATH,
    LABEL_ENCODER_PATH,
    FACE_RECOGNITION_MODEL,
    PREDICT_PROBA_THRESHOLD,
)

from utils_v2 import crop_face_with_margin, resize_face


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FrameRequest(BaseModel):
    image: str


detector = None
model = None
encoder = None


@app.on_event("startup")
def load_models():
    global detector, model, encoder

    if not Path(YOLO_FACE_MODEL).exists():
        raise FileNotFoundError(f"Không tìm thấy YOLO model: {YOLO_FACE_MODEL}")

    if not Path(SVM_MODEL_PATH).exists():
        raise FileNotFoundError(f"Không tìm thấy SVM model: {SVM_MODEL_PATH}")

    if not Path(LABEL_ENCODER_PATH).exists():
        raise FileNotFoundError(
            f"Không tìm thấy label encoder: {LABEL_ENCODER_PATH}"
        )

    detector = YOLO(str(YOLO_FACE_MODEL))
    model = joblib.load(SVM_MODEL_PATH)
    encoder = joblib.load(LABEL_ENCODER_PATH)

    print("Đã load model nhận diện khuôn mặt")
    print("Classes:", encoder.classes_)


def decode_base64_image(image_base64):
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    image_bytes = base64.b64decode(image_base64)
    np_arr = np.frombuffer(image_bytes, np.uint8)

    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return frame


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


@app.post("/recognize")
def recognize_face(payload: FrameRequest):
    frame = decode_base64_image(payload.image)

    if frame is None:
        return {
            "success": False,
            "message": "Không đọc được ảnh",
            "faces": [],
        }

    results = detector(frame, verbose=False)

    faces = []

    for r in results:
        for b in r.boxes:
            x1, y1, x2, y2 = map(int, b.xyxy[0])

            face = crop_face_with_margin(frame, (x1, y1, x2, y2))

            if face is None:
                faces.append({
                    "label": "Bad crop",
                    "confidence": 0,
                    "box": [x1, y1, x2, y2],
                })
                continue

            emb = extract_embedding(face)

            if emb is None:
                faces.append({
                    "label": "Unknown",
                    "confidence": 0,
                    "box": [x1, y1, x2, y2],
                })
                continue

            probs = model.predict_proba(emb)[0]
            best_idx = int(np.argmax(probs))
            confidence = float(probs[best_idx])
            label = str(encoder.inverse_transform([best_idx])[0])

            if confidence < PREDICT_PROBA_THRESHOLD:
                label = "Unknown"

            faces.append({
                "label": label,
                "confidence": round(confidence, 4),
                "box": [x1, y1, x2, y2],
            })

    return {
        "success": True,
        "faces": faces,
    }