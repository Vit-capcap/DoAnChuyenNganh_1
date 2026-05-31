import pandas as pd

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\department_dataset_vku.xlsx"

departments = [
    {
        "id_department": 1,
        "department_name": "Information Technology",
        "description": "Khoa Công nghệ thông tin"
    },
    {
        "id_department": 2,
        "department_name": "Business Administration",
        "description": "Khoa Quản trị kinh doanh"
    },
    {
        "id_department": 3,
        "department_name": "Graphic Design",
        "description": "Khoa Thiết kế đồ họa"
    },
    {
        "id_department": 4,
        "department_name": "Artificial Intelligence",
        "description": "Khoa Trí tuệ nhân tạo"
    },
    {
        "id_department": 5,
        "department_name": "Software Engineering",
        "description": "Khoa Kỹ thuật phần mềm"
    },
    {
        "id_department": 6,
        "department_name": "Information System",
        "description": "Khoa Hệ thống thông tin"
    }
]

df = pd.DataFrame(departments)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Excel Department thành công!")
print(f"File: {OUTPUT_FILE}")