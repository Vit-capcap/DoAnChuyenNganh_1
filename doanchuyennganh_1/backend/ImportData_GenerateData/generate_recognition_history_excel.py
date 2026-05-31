import pandas as pd
import mysql.connector
import random
from datetime import datetime, timedelta

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\recognition_history_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_student FROM Student")
students = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT id_camera FROM CameraDevice")
cameras = [row[0] for row in cursor.fetchall()]

data = []

for i in range(300):
    id_student = random.choice(students)
    camera_id = random.choice(cameras)
    result = random.choice(["SUCCESS", "FAILED"])

    data.append({
        "id_student": id_student,
        "capture_time": datetime.now() - timedelta(days=random.randint(1, 90)),
        "confidence": round(random.uniform(0.65, 0.99), 4) if result == "SUCCESS" else round(random.uniform(0.2, 0.6), 4),
        "camera_id": camera_id,
        "result": result,
        "image_path": f"recognition/student_{id_student}_camera_{camera_id}_{i}.jpg"
    })

df = pd.DataFrame(data)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo RecognitionHistory Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()