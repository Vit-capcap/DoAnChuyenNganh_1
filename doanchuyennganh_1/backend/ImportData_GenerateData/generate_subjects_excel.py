import pandas as pd

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\subject_dataset_vku.xlsx"

subjects = [
    ["IT101", "Nhập môn lập trình", 3, "Môn cơ sở về lập trình"],
    ["IT102", "Cấu trúc dữ liệu và giải thuật", 3, "Học về cấu trúc dữ liệu và thuật toán"],
    ["IT103", "Cơ sở dữ liệu", 3, "Thiết kế và truy vấn cơ sở dữ liệu"],
    ["IT104", "Lập trình Web", 3, "HTML, CSS, JavaScript, Backend"],
    ["IT105", "Lập trình Python", 3, "Lập trình Python cơ bản đến nâng cao"],
    ["SE101", "Công nghệ phần mềm", 3, "Quy trình phát triển phần mềm"],
    ["SE102", "Kiểm thử phần mềm", 3, "Kỹ thuật kiểm thử phần mềm"],
    ["AI101", "Trí tuệ nhân tạo", 3, "Các khái niệm cơ bản về AI"],
    ["AI102", "Machine Learning", 3, "Học máy và ứng dụng"],
    ["DB101", "Hệ quản trị cơ sở dữ liệu", 3, "MySQL, SQL Server"],
    ["NET101", "Mạng máy tính", 3, "Kiến thức nền tảng về mạng"],
    ["OS101", "Hệ điều hành", 3, "Tiến trình, bộ nhớ, file system"],
]

df = pd.DataFrame(subjects, columns=[
    "subject_code",
    "subject_name",
    "credits",
    "description"
])

df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Subject Excel thành công!")
print(f"File: {OUTPUT_FILE}")