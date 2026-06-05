"""
Train model nhận diện khuôn mặt bằng SVM.

Cách chạy:
python train_face_model.py

Input:
dataset/embeddings/face_embeddings.npz

Output:
models/svm_face_model.pkl
models/label_encoder.pkl

Lưu ý:
- Nếu chỉ có 1 sinh viên/class, SVM không train thật sự được.
- Khi chỉ có 1 class, file sẽ dùng DummyClassifier để test tạm, tránh lỗi.
- Muốn nhận diện chính xác cần ít nhất 2 sinh viên/class trở lên.
"""

import joblib
import numpy as np
from pathlib import Path

from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC
from sklearn.dummy import DummyClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import train_test_split

from config_v2 import (
    EMBEDDINGS_FILE,
    MODEL_DIR,
    SVM_MODEL_PATH,
    LABEL_ENCODER_PATH,
)

from utils_v2 import ensure_dirs


def print_class_statistics(y, classes):
    print("\n========== THỐNG KÊ DỮ LIỆU THEO CLASS ==========")

    class_counts = {}

    for label in classes:
        count = int(np.sum(y == label))
        class_counts[label] = count
        print(f"- {label}: {count} mẫu")

    print("=================================================")

    return class_counts


def build_svm_model():
    """
    Pipeline chuẩn:
    - StandardScaler: chuẩn hóa vector embedding
    - SVC: SVM phân loại khuôn mặt
    """
    return Pipeline(
        [
            ("scaler", StandardScaler()),
            (
                "svm",
                SVC(
                    kernel="linear",
                    probability=True,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )


def build_dummy_model():
    """
    Dùng tạm khi dataset chỉ có 1 class.
    Không dùng cho nhận diện thực tế.
    """
    return Pipeline(
        [
            ("scaler", StandardScaler()),
            ("dummy", DummyClassifier(strategy="most_frequent")),
        ]
    )


def train_model():
    ensure_dirs(MODEL_DIR)

    if not Path(EMBEDDINGS_FILE).exists():
        print(f"[ERROR] Không tìm thấy embeddings file: {EMBEDDINGS_FILE}")
        print("Hãy chạy trước:")
        print("python extract_embeddings.py")
        return

    data = np.load(EMBEDDINGS_FILE, allow_pickle=True)

    if "X" not in data or "y" not in data:
        print("[ERROR] File embedding không đúng định dạng.")
        print("File cần có X và y.")
        return

    X = data["X"]
    y = data["y"]

    if X is None or y is None or len(X) == 0 or len(y) == 0:
        print("[ERROR] Không có dữ liệu embedding để train.")
        return

    if len(X) != len(y):
        print("[ERROR] Số lượng X và y không khớp.")
        print("X:", len(X))
        print("y:", len(y))
        return

    X = np.array(X, dtype=np.float32)
    y = np.array(y)

    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)

    print("========== THÔNG TIN DATASET ==========")
    print("Embedding file:", EMBEDDINGS_FILE)
    print("Số mẫu:", len(X))
    print("Kích thước embedding:", X.shape)
    print("Số class:", len(encoder.classes_))
    print("Classes:", encoder.classes_)
    print("=======================================")

    class_counts = print_class_statistics(y, encoder.classes_)

    # =========================
    # Trường hợp chỉ có 1 class
    # =========================
    if len(encoder.classes_) < 2:
        print("\n[WARN] Dataset hiện chỉ có 1 class.")
        print("[WARN] SVM không thể train thật sự với 1 class.")
        print("[WARN] Đang dùng DummyClassifier để tạo model test tạm.")
        print("[WARN] Muốn nhận diện thực tế, hãy thêm ít nhất 1 sinh viên khác.")

        model = build_dummy_model()
        model.fit(X, y_encoded)

        joblib.dump(model, SVM_MODEL_PATH)
        joblib.dump(encoder, LABEL_ENCODER_PATH)

        print("\n========== ĐÃ LƯU MODEL TEST TẠM ==========")
        print("Model:", SVM_MODEL_PATH)
        print("LabelEncoder:", LABEL_ENCODER_PATH)
        print("===========================================")
        return

    # =========================
    # Trường hợp có từ 2 class trở lên
    # =========================
    model = build_svm_model()

    min_count = min(class_counts.values())

    # Nếu mỗi class có đủ ít nhất 2 mẫu và tổng mẫu đủ thì chia validation nội bộ.
    can_split_validation = min_count >= 2 and len(X) >= 10

    if can_split_validation:
        print("\n[INFO] Dữ liệu đủ để chia validation nội bộ.")
        print("[INFO] Train 80%, validation 20%.")

        X_train, X_val, y_train, y_val = train_test_split(
            X,
            y_encoded,
            test_size=0.2,
            random_state=42,
            stratify=y_encoded,
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_val)

        accuracy = accuracy_score(y_val, y_pred)

        print("\n========== KẾT QUẢ VALIDATION ==========")
        print(f"Accuracy: {accuracy * 100:.2f}%")
        print("\nClassification report:")
        print(
            classification_report(
                y_val,
                y_pred,
                target_names=encoder.classes_,
                zero_division=0,
            )
        )
        print("========================================")

        # Sau khi đánh giá xong, train lại trên toàn bộ dữ liệu để model cuối mạnh hơn.
        print("\n[INFO] Train lại model cuối bằng toàn bộ dataset...")
        model.fit(X, y_encoded)

    else:
        print("\n[WARN] Dữ liệu chưa đủ để chia validation nội bộ.")
        print("[WARN] Sẽ train toàn bộ dataset.")
        print("[WARN] Nếu muốn đánh giá chuẩn, hãy dùng split_dataset.py và evaluate_face_model.py.")
        model.fit(X, y_encoded)

    # =========================
    # Lưu model
    # =========================
    joblib.dump(model, SVM_MODEL_PATH)
    joblib.dump(encoder, LABEL_ENCODER_PATH)

    print("\n========== ĐÃ LƯU MODEL ==========")
    print("SVM:", SVM_MODEL_PATH)
    print("LabelEncoder:", LABEL_ENCODER_PATH)
    print("==================================")

    print("\nBước tiếp theo:")
    print("python test_camera.py")
    print("hoặc")
    print("python face_attendance_mysql_api.py")


if __name__ == "__main__":
    train_model()