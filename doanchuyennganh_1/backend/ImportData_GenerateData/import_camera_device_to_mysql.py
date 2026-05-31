import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\camera_device_dataset_vku.xlsx"

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

cursor.execute("SELECT id_room FROM ClassRoom")
valid_room_ids = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO CameraDevice (
    camera_name,
    camera_ip,
    location,
    id_room,
    status
)
VALUES (%s, %s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_room = int(row["id_room"])

        if id_room not in valid_room_ids:
            raise ValueError(f"id_room {id_room} không tồn tại trong ClassRoom")

        values = (
            row["camera_name"],
            row["camera_ip"],
            row["location"],
            id_room,
            row["status"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import CameraDevice hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()