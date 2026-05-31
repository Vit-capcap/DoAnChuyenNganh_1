# import pandas as pd
# import mysql.connector
# import random
# from datetime import datetime, timedelta

# OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\attendance_dataset_vku.xlsx"

# DB_CONFIG = {
#     "host": "localhost",
#     "user": "root",
#     "password": "12345678",
#     "database": "face_attendance_system"
# }

# conn = mysql.connector.connect(**DB_CONFIG)
# cursor = conn.cursor()

# cursor.execute("SELECT id_session, session_date FROM Session")
# sessions = cursor.fetchall()

# cursor.execute("SELECT id_student FROM Student")
# students = [row[0] for row in cursor.fetchall()]

# attendance_data = []
# used_pairs = set()

# for id_session, session_date in sessions:
#     selected_students = random.sample(students, min(25, len(students)))

#     for id_student in selected_students:
#         pair = (id_session, id_student)

#         if pair in used_pairs:
#             continue

#         used_pairs.add(pair)

#         status = random.choice(["PRESENT", "ABSENT", "LATE"])

#         if status == "ABSENT":
#             check_in_time = None
#             confidence_score = None
#             face_image = None
#             note = "Vắng mặt"
#         else:
#             check_in_time = datetime.combine(session_date, datetime.min.time()) + timedelta(
#                 hours=random.choice([7, 9, 13, 15]),
#                 minutes=random.randint(0, 30)
#             )

#             confidence_score = round(random.uniform(0.75, 0.99), 4)
#             face_image = f"attendance/session_{id_session}/student_{id_student}.jpg"
#             note = "Điểm danh thành công" if status == "PRESENT" else "Đi muộn"

#         attendance_data.append({
#             "id_session": id_session,
#             "id_student": id_student,
#             "check_in_time": check_in_time,
#             "status": status,
#             "confidence_score": confidence_score,
#             "face_image": face_image,
#             "note": note
#         })

# df = pd.DataFrame(attendance_data)
# df.to_excel(OUTPUT_FILE, index=False)

# print("Tạo file Attendance Excel thành công!")
# print(f"File: {OUTPUT_FILE}")
# print(f"Số bản ghi điểm danh: {len(attendance_data)}")

# cursor.close()
# conn.close()
import pandas as pd
import mysql.connector
import random
from datetime import datetime, timedelta, date

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\attendance_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

# =========================
# Kết nối MySQL
# =========================
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

# =========================
# Lấy ngày hiện tại và ngày 7 ngày trước
# =========================
today = date.today()
seven_days_ago = today - timedelta(days=7)

print("Ngày hiện tại:", today)
print("Lấy dữ liệu từ:", seven_days_ago, "đến", today)

# =========================
# Chỉ lấy các session trong 7 ngày trước
# =========================
cursor.execute(
    """
    SELECT id_session, session_date
    FROM Session
    WHERE session_date BETWEEN %s AND %s
    ORDER BY session_date ASC
    """,
    (seven_days_ago, today)
)

sessions = cursor.fetchall()

# =========================
# Lấy danh sách sinh viên
# =========================
cursor.execute("SELECT id_student FROM Student")
students = [row[0] for row in cursor.fetchall()]

# =========================
# Kiểm tra nếu không có dữ liệu
# =========================
if not sessions:
    print("Không có buổi học nào trong 7 ngày trước.")
    cursor.close()
    conn.close()
    exit()

if not students:
    print("Không có sinh viên nào trong bảng Student.")
    cursor.close()
    conn.close()
    exit()

attendance_data = []
used_pairs = set()

# =========================
# Tạo dữ liệu điểm danh cho từng buổi học
# =========================
for id_session, session_date in sessions:
    # Mỗi buổi chọn ngẫu nhiên tối đa 25 sinh viên
    selected_students = random.sample(students, min(25, len(students)))

    for id_student in selected_students:
        pair = (id_session, id_student)

        # Tránh trùng một sinh viên trong cùng một buổi học
        if pair in used_pairs:
            continue

        used_pairs.add(pair)

        # Random trạng thái điểm danh
        status = random.choice(["PRESENT", "ABSENT", "LATE"])

        if status == "ABSENT":
            check_in_time = None
            confidence_score = None
            face_image = None
            note = "Vắng mặt"
        else:
            # Tạo thời gian điểm danh dựa theo ngày của session
            check_in_time = datetime.combine(
                session_date,
                datetime.min.time()
            ) + timedelta(
                hours=random.choice([7, 9, 13, 15]),
                minutes=random.randint(0, 30)
            )

            confidence_score = round(random.uniform(0.75, 0.99), 4)
            face_image = f"attendance/session_{id_session}/student_{id_student}.jpg"
            note = "Điểm danh thành công" if status == "PRESENT" else "Đi muộn"

        attendance_data.append({
            "id_session": id_session,
            "id_student": id_student,
            "check_in_time": check_in_time,
            "status": status,
            "confidence_score": confidence_score,
            "face_image": face_image,
            "note": note
        })

# =========================
# Xuất dữ liệu ra Excel
# =========================
df = pd.DataFrame(attendance_data)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Attendance Excel thành công!")
print(f"File: {OUTPUT_FILE}")
print(f"Số session trong 7 ngày trước: {len(sessions)}")
print(f"Số bản ghi điểm danh: {len(attendance_data)}")

cursor.close()
conn.close()