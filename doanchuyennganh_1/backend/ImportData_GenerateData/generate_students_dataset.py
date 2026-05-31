import random
import pandas as pd
from faker import Faker
from datetime import datetime
import unicodedata

fake = Faker("vi_VN")

NUMBER_OF_STUDENTS = 1000
OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Dataset_Excel\\student_dataset_vku.xlsx"

COURSE_YEAR_BIRTH = {
    "K22": 2002,
    "K23": 2003,
    "K24": 2004,
    "K25": 2005,
    "K26": 2006,
}

faculties = {
    "IT": "Information Technology",
    "BA": "Business Administration",
    "GD": "Graphic Design",
    "AI": "Artificial Intelligence",
    "SE": "Software Engineering",
    "IS": "Information System",
}

genders = ["Nam", "Nữ"]
statuses = ["ACTIVE", "INACTIVE"]

ho_list = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Võ", "Đặng", "Bùi", "Đỗ"]
ten_dem_list = ["Văn", "Quốc", "Minh", "Anh", "Thành", "Gia", "Tuấn", "Ngọc", "Thanh", "Hữu"]
ten_chinh_nam = ["Hoàng", "Nam", "Huy", "Khang", "Long", "Đạt", "Dũng", "Phúc", "Kiên", "Sơn"]
ten_chinh_nu = ["An", "Linh", "Hà", "Trang", "Ngọc", "Vy", "My", "Nhi", "Thảo", "Yến"]


def remove_vietnamese_accents(text):
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("utf-8")
    return text.replace("Đ", "D").replace("đ", "d")


def generate_full_name(gender):
    ho = random.choice(ho_list)
    ten_dem = random.choice(ten_dem_list)

    if gender == "Nam":
        ten_chinh = random.choice(ten_chinh_nam)
    else:
        ten_chinh = random.choice(ten_chinh_nu)

    return f"{ho} {ten_dem} {ten_chinh}"


def generate_email(full_name, course_year, faculty_code):
    name_no_accent = remove_vietnamese_accents(full_name).lower()
    parts = name_no_accent.split()

    ten_chinh = parts[-1]
    ky_tu_dau = "".join([p[0] for p in parts[:-1]])

    year_number = course_year.replace("K", "")

    return f"{ten_chinh}{ky_tu_dau}.{year_number}{faculty_code.lower()}@vku.udn.vn"


def generate_date_of_birth(course_year):
    birth_year = COURSE_YEAR_BIRTH[course_year]
    month = random.randint(1, 12)
    day = random.randint(1, 28)

    return f"{birth_year}-{month:02d}-{day:02d}"


def generate_phone():
    return "84" + str(random.randint(100000000, 999999999))


students = []
used_student_codes = set()
used_emails = set()

for i in range(1, NUMBER_OF_STUDENTS + 1):
    course_year = random.choice(list(COURSE_YEAR_BIRTH.keys()))
    faculty_code = random.choice(list(faculties.keys()))
    year_number = course_year.replace("K", "")

    gender = random.choice(genders)
    full_name = generate_full_name(gender)

    while True:
        random_number = random.randint(0, 999)
        student_code = f"{year_number}{faculty_code}{random_number:03d}"

        if student_code not in used_student_codes:
            used_student_codes.add(student_code)
            break

    base_email = generate_email(full_name, course_year, faculty_code)
    email = base_email

    count = 1
    while email in used_emails:
        email = base_email.replace("@", f"{count}@")
        count += 1

    used_emails.add(email)

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    student = {
        "id_student": i,
        "student_code": student_code,
        "full_name": full_name,
        "gender": gender,
        "date_of_birth": generate_date_of_birth(course_year),
        "phone": generate_phone(),
        "email": email,
        "avatar": f"avatars/{student_code}.jpg",

        "faculty": faculties[faculty_code],
        "class_name": f"{year_number}{faculty_code}",
        "course_year": course_year,

        "status": random.choice(statuses),

        "created_at": now,
        "updated_at": now
    }

    students.append(student)

df = pd.DataFrame(students)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo dataset thành công!")
print(f"Số lượng học sinh: {NUMBER_OF_STUDENTS}")
print(f"File Excel: {OUTPUT_FILE}")