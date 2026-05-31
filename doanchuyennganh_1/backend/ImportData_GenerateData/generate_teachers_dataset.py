import random
import pandas as pd
from faker import Faker
from datetime import datetime
import unicodedata

fake = Faker("vi_VN")

# =========================
# CẤU HÌNH
# =========================
NUMBER_OF_TEACHERS = 40
OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\teacher_dataset_vku.xlsx"

# =========================
# DANH SÁCH KHOA
# department_id phải tồn tại trong MySQL
# =========================
departments = {
    1: "Information Technology",
    2: "Business Administration",
    3: "Graphic Design",
    4: "Artificial Intelligence",
    5: "Software Engineering",
    6: "Information System"
}

department_codes = {
    1: "IT",
    2: "BA",
    3: "GD",
    4: "AI",
    5: "SE",
    6: "IS"
}

genders = ["Male", "Female"]
password_default = "123456"

# =========================
# TÊN TIẾNG VIỆT
# =========================
ho_list = [
    "Nguyễn", "Trần", "Lê", "Phạm",
    "Hoàng", "Huỳnh", "Võ",
    "Đặng", "Bùi", "Đỗ"
]

ten_dem_list = [
    "Văn", "Quốc", "Minh", "Anh",
    "Thành", "Gia", "Tuấn",
    "Ngọc", "Thanh", "Hữu"
]

ten_chinh_nam = [
    "Hoàng", "Nam", "Huy", "Khang",
    "Long", "Đạt", "Dũng",
    "Phúc", "Kiên", "Sơn"
]

ten_chinh_nu = [
    "An", "Linh", "Hà", "Trang",
    "Ngọc", "Vy", "My",
    "Nhi", "Thảo", "Yến"
]

# =========================
# BỎ DẤU TIẾNG VIỆT
# =========================
def remove_vietnamese_accents(text):
    text = unicodedata.normalize("NFD", text)
    text = text.encode("ascii", "ignore").decode("utf-8")
    return text.replace("Đ", "D").replace("đ", "d")


# =========================
# TẠO HỌ TÊN
# =========================
def generate_full_name(gender):

    ho = random.choice(ho_list)
    ten_dem = random.choice(ten_dem_list)

    if gender == "Male":
        ten_chinh = random.choice(ten_chinh_nam)
    else:
        ten_chinh = random.choice(ten_chinh_nu)

    return f"{ho} {ten_dem} {ten_chinh}"


# =========================
# EMAIL GIÁO VIÊN
# Ví dụ:
# hoangnq.gv.it@vku.udn.vn
# =========================
def generate_email(full_name, department_code):

    name_no_accent = remove_vietnamese_accents(full_name).lower()

    parts = name_no_accent.split()

    ten_chinh = parts[-1]

    ky_tu_dau = "".join([p[0] for p in parts[:-1]])

    return f"{ten_chinh}{ky_tu_dau}.gv.{department_code.lower()}@vku.udn.vn"


# =========================
# SĐT
# =========================
def generate_phone():
    return "84" + str(random.randint(100000000, 999999999))


# =========================
# TẠO DATASET
# =========================
teachers = []

used_teacher_codes = set()
used_emails = set()

for i in range(1, NUMBER_OF_TEACHERS + 1):

    gender = random.choice(genders)

    full_name = generate_full_name(gender)

    department_id = random.choice(list(departments.keys()))

    department_code = department_codes[department_id]

    # =========================
    # MÃ GIÁO VIÊN
    # VD:
    # GVIT001
    # =========================
    while True:

        random_number = random.randint(1, 999)

        teacher_code = f"GV{department_code}{random_number:03d}"

        if teacher_code not in used_teacher_codes:
            used_teacher_codes.add(teacher_code)
            break

    # =========================
    # EMAIL
    # =========================
    base_email = generate_email(full_name, department_code)

    email = base_email

    count = 1

    while email in used_emails:

        email = base_email.replace("@", f"{count}@")

        count += 1

    used_emails.add(email)

    # =========================
    # NĂM SINH
    # =========================
    birth_year = random.randint(1980, 1998)

    month = random.randint(1, 12)

    day = random.randint(1, 28)

    date_of_birth = f"{birth_year}-{month:02d}-{day:02d}"

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    teacher = {

        "id_teacher": i,

        "teacher_code": teacher_code,

        "full_name": full_name,

        "gender": gender,

        "date_of_birth": date_of_birth,

        "phone": generate_phone(),

        "email": email,

        "avatar": f"avatars_teachers/{teacher_code}.jpg",

        "password": password_default,

        "department_id": department_id,

        "created_at": now,

        "updated_at": now
    }

    teachers.append(teacher)

# =========================
# EXPORT EXCEL
# =========================
df = pd.DataFrame(teachers)

df.to_excel(OUTPUT_FILE, index=False)

print("Tạo dataset giáo viên thành công!")

print(f"Số lượng giáo viên: {NUMBER_OF_TEACHERS}")

print(f"File xuất: {OUTPUT_FILE}")