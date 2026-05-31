import pandas as pd
import mysql.connector
import random

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\course_class_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_subject, subject_code FROM Subject")
subjects = cursor.fetchall()

cursor.execute("SELECT id_teacher, teacher_code FROM Teacher")
teachers = cursor.fetchall()

course_classes = []
used_class_codes = set()

NUMBER_OF_COURSE_CLASSES = 30

for i in range(1, NUMBER_OF_COURSE_CLASSES + 1):
    id_subject, subject_code = random.choice(subjects)
    id_teacher, teacher_code = random.choice(teachers)

    semester = random.choice(["HK1", "HK2", "HK3"])
    school_year = random.choice(["2024-2025", "2025-2026"])
    group_number = str(random.randint(1, 5))

    while True:
        class_code = f"{subject_code}_{semester}_{group_number}_{random.randint(100, 999)}"

        if class_code not in used_class_codes:
            used_class_codes.add(class_code)
            break

    course_classes.append({
        "class_code": class_code,
        "id_subject": id_subject,
        "id_teacher": id_teacher,
        "semester": semester,
        "school_year": school_year,
        "group_number": group_number,
        "max_student": random.choice([40, 45, 50, 60]),
        "status": random.choice(["OPEN", "CLOSED"])
    })

df = pd.DataFrame(course_classes)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file CourseClass Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()