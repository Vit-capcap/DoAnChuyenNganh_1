import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\session_dataset_vku.xlsx"

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

cursor.execute("SELECT id_schedule FROM Schedule")
valid_schedule_ids = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO Session (
    id_schedule,
    session_date,
    session_number,
    status
)
VALUES (%s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_schedule = int(row["id_schedule"])

        if id_schedule not in valid_schedule_ids:
            raise ValueError(f"id_schedule {id_schedule} không tồn tại")

        values = (
            id_schedule,
            row["session_date"],
            int(row["session_number"]),
            row["status"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Session hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()