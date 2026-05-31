import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\subject_dataset_vku.xlsx"

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

sql = """
INSERT INTO Subject (
    subject_code,
    subject_name,
    credits,
    description
)
VALUES (%s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    subject_name = VALUES(subject_name),
    credits = VALUES(credits),
    description = VALUES(description)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        values = (
            row["subject_code"],
            row["subject_name"],
            int(row["credits"]),
            row["description"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Subject hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()