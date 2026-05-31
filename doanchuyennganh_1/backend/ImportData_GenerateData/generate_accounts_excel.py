import pandas as pd
import mysql.connector
from datetime import datetime, timedelta
import random

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\account_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_teacher, teacher_code FROM Teacher")
teachers = cursor.fetchall()

cursor.execute("SELECT id_student, student_code FROM Student")
students = cursor.fetchall()

accounts = []

accounts.append({
    "username": "admin",
    "password": "admin123",
    "role": "ADMIN",
    "teacher_id": None,
    "student_id": None,
    "last_login": datetime.now(),
    "status": "ACTIVE"
})

for id_teacher, teacher_code in teachers:
    accounts.append({
        "username": teacher_code.lower(),
        "password": "123456",
        "role": "TEACHER",
        "teacher_id": id_teacher,
        "student_id": None,
        "last_login": datetime.now() - timedelta(days=random.randint(1, 30)),
        "status": random.choice(["ACTIVE", "LOCKED"])
    })

for id_student, student_code in students:
    accounts.append({
        "username": student_code.lower(),
        "password": "123456",
        "role": "STUDENT",
        "teacher_id": None,
        "student_id": id_student,
        "last_login": datetime.now() - timedelta(days=random.randint(1, 30)),
        "status": random.choice(["ACTIVE", "LOCKED"])
    })

df = pd.DataFrame(accounts)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo Account Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()