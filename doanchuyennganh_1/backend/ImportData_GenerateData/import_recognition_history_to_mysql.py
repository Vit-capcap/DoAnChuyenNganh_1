import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\recognition_history_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

if not os.path.exists(EXCEL_FILE):
    print("Không tìm thấy file Excel!")
    exit()

df = pd.read_excel(EXCEL_FILE)
df = df.where(pd.notnull(df), None)

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_student FROM Student")
valid_students = {row[0] for row in cursor.fetchall()}

cursor.execute("SELECT id_camera FROM CameraDevice")
valid_cameras = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO RecognitionHistory (
    id_student,
    capture_time,
    confidence,
    camera_id,
    result,
    image_path
)
VALUES (%s, %s, %s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_student = int(row["id_student"])
        camera_id = int(row["camera_id"])

        if id_student not in valid_students:
            raise ValueError(f"id_student {id_student} không tồn tại")

        if camera_id not in valid_cameras:
            raise ValueError(f"camera_id {camera_id} không tồn tại")

        values = (
            id_student,
            row["capture_time"],
            float(row["confidence"]),
            camera_id,
            row["result"],
            row["image_path"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import RecognitionHistory hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()