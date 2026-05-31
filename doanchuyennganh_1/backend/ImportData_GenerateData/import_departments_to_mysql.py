import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\department_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

if not os.path.exists(EXCEL_FILE):
    print("Không tìm thấy file Excel!")
    print("Đường dẫn:", EXCEL_FILE)
    exit()

df = pd.read_excel(EXCEL_FILE)
df = df.where(pd.notnull(df), None)

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

sql = """
INSERT INTO Department (
    id_department,
    department_name,
    description
)
VALUES (%s, %s, %s)
ON DUPLICATE KEY UPDATE
    department_name = VALUES(department_name),
    description = VALUES(description)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        values = (
            int(row["id_department"]),
            row["department_name"],
            row["description"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Department hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()