import pandas as pd
import mysql.connector
import random
import json

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\facedata_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_student, student_code FROM Student")
students = cursor.fetchall()

face_data = []

for id_student, student_code in students:
    embedding = [round(random.uniform(-1, 1), 6) for _ in range(128)]

    face_data.append({
        "id_student": id_student,
        "face_embedding": json.dumps(embedding),
        "face_image": f"faces/{student_code}.jpg",
        "model_version": "FaceNet-v1"
    })

df = pd.DataFrame(face_data)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file FaceData Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()