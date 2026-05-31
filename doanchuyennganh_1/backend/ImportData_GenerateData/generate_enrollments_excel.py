import pandas as pd
import mysql.connector
import random
from datetime import datetime, timedelta

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\enrollment_dataset_vku.xlsx"

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

cursor.execute("SELECT id_course_class FROM CourseClass")
course_classes = [row[0] for row in cursor.fetchall()]

enrollments = []
used_pairs = set()

NUMBER_OF_ENROLLMENTS = 300

for i in range(NUMBER_OF_ENROLLMENTS):
    while True:
        id_student = random.choice(students)
        id_course_class = random.choice(course_classes)

        pair = (id_student, id_course_class)

        if pair not in used_pairs:
            used_pairs.add(pair)
            break

    enroll_date = datetime.now() - timedelta(days=random.randint(1, 180))

    enrollments.append({
        "id_student": id_student,
        "id_course_class": id_course_class,
        "enroll_date": enroll_date.strftime("%Y-%m-%d %H:%M:%S"),
        "status": random.choice(["STUDYING", "FINISHED", "CANCELLED"])
    })

df = pd.DataFrame(enrollments)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Enrollment Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()