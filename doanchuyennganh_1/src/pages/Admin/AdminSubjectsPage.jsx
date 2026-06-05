import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

/* =========================================================
   FILE: AdminSubjectsPage.jsx
   ---------------------------------------------------------
   Chức năng:
   - Hiển thị danh sách môn học
   - Tìm kiếm, lọc trạng thái, sắp xếp
   - Thêm môn học
   - Cập nhật môn học
   - Xóa môn học
   - Xuất CSV
   - Phân trang

   API dùng:
   - GET    /api/subjects
   - POST   /api/subjects
   - PUT    /api/subjects/:id
   - DELETE /api/subjects/:id

   Dữ liệu backend trả về:
   {
     subjects,
     stats,
     pagination
   }
========================================================= */


/* =========================================================
   1. FORM MẶC ĐỊNH
========================================================= */
const INITIAL_FORM = {
  id_subject: "",
  subject_code: "",
  subject_name: "",
  credits: 3,
  description: "",
};


/* =========================================================
   2. HELPER DÙNG CHUNG
========================================================= */

/*
|--------------------------------------------------------------------------
| handleResponse()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra response từ backend.
| - Nếu backend trả HTML do sai route thì báo lỗi rõ.
| - Nếu backend trả lỗi JSON thì lấy message từ backend.
|--------------------------------------------------------------------------
*/
async function handleResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API hoặc backend chưa chạy."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API");
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| getInitials()
|--------------------------------------------------------------------------
| Chức năng:
| - Lấy chữ cái đại diện cho tên giáo viên.
|--------------------------------------------------------------------------
*/
function getInitials(name) {
  if (!name) return "GV";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| getStatusLabel()
|--------------------------------------------------------------------------
| Chức năng:
| - Hiển thị trạng thái môn học theo tiếng Việt.
|--------------------------------------------------------------------------
*/
function getStatusLabel(status) {
  if (status === "ACTIVE") return "Đang giảng dạy";
  return "Tạm ngưng";
}

/*
|--------------------------------------------------------------------------
| getStatusClass()
|--------------------------------------------------------------------------
| Chức năng:
| - Trả class Tailwind theo trạng thái môn học.
|--------------------------------------------------------------------------
*/
function getStatusClass(status) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}

/*
|--------------------------------------------------------------------------
| normalizeNumber()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa số để tránh NaN khi hiển thị.
|--------------------------------------------------------------------------
*/
function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

/*
|--------------------------------------------------------------------------
| buildQueryString()
|--------------------------------------------------------------------------
| Chức năng:
| - Tạo query string cho API GET /api/subjects.
|--------------------------------------------------------------------------
*/
function buildQueryString({ search, statusFilter, sort, page }) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (statusFilter) {
    params.append("status", statusFilter);
  }

  if (sort) {
    params.append("sort", sort);
  }

  params.append("page", String(page));
  params.append("limit", "10");

  return params.toString();
}

/*
|--------------------------------------------------------------------------
| downloadCSV()
|--------------------------------------------------------------------------
| Chức năng:
| - Tạo file CSV và tải về trình duyệt.
|--------------------------------------------------------------------------
*/
function downloadCSV(filename, headers, rows) {
  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}


/* =========================================================
   3. PAGE CHÍNH
========================================================= */
export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);

  const [stats, setStats] = useState({
    total_subjects: 0,
    active_subjects: 0,
    average_credits: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  /* ---------------------------------------------------------
     Load danh sách môn học
     - Có debounce 300ms khi search/filter/sort thay đổi.
     - Có isMounted để tránh setState sau khi component unmount.
  --------------------------------------------------------- */
  useEffect(() => {
    let isMounted = true;

    const loadSubjects = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }

        const queryString = buildQueryString({
          search,
          statusFilter,
          sort,
          page,
        });

        const response = await fetch(`${API_URL}/subjects?${queryString}`);
        const data = await handleResponse(response);

        if (!isMounted) return;

        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);

        setStats(
          data.stats || {
            total_subjects: 0,
            active_subjects: 0,
            average_credits: 0,
          }
        );

        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          }
        );

        setMessage("");
      } catch (error) {
        console.error("Lỗi tải môn học:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách môn học");
          setSubjects([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(loadSubjects, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [search, statusFilter, sort, page, refreshKey]);

  /* ---------------------------------------------------------
     Cards thống kê đầu trang
  --------------------------------------------------------- */
  const statCards = useMemo(
    () => [
      {
        title: "Tổng số môn học",
        value: normalizeNumber(stats.total_subjects),
        icon: "menu_book",
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Đang giảng dạy",
        value: normalizeNumber(stats.active_subjects),
        icon: "check_circle",
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Tín chỉ trung bình",
        value: normalizeNumber(stats.average_credits),
        icon: "functions",
        iconClass: "bg-indigo-50 text-indigo-600",
      },
    ],
    [stats]
  );

  /* ---------------------------------------------------------
     Reset bộ lọc
  --------------------------------------------------------- */
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSort("newest");
    setPage(1);
    setMessage("");
    setSuccessMessage("");
  };

  /* ---------------------------------------------------------
     Mở modal thêm môn học
  --------------------------------------------------------- */
  const openAddModal = () => {
    setModalMode("add");
    setFormData(INITIAL_FORM);
    setShowModal(true);
    setMessage("");
    setSuccessMessage("");
  };

  /* ---------------------------------------------------------
     Mở modal sửa môn học
  --------------------------------------------------------- */
  const openEditModal = (subject) => {
    setModalMode("edit");

    setFormData({
      id_subject: subject.id_subject || "",
      subject_code: subject.subject_code || "",
      subject_name: subject.subject_name || "",
      credits: subject.credits || 3,
      description: subject.description || "",
    });

    setShowModal(true);
    setMessage("");
    setSuccessMessage("");
  };

  /* ---------------------------------------------------------
     Đóng modal
  --------------------------------------------------------- */
  const closeModal = () => {
    setShowModal(false);
    setFormData(INITIAL_FORM);
    setSaving(false);
  };

  /* ---------------------------------------------------------
     Thay đổi dữ liệu trong form
  --------------------------------------------------------- */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------------------------------------------------
     Validate form trước khi gửi backend
  --------------------------------------------------------- */
  const validateForm = () => {
    if (!formData.subject_code.trim()) {
      setMessage("Vui lòng nhập mã môn học");
      return false;
    }

    if (!formData.subject_name.trim()) {
      setMessage("Vui lòng nhập tên môn học");
      return false;
    }

    if (!formData.credits || Number(formData.credits) <= 0) {
      setMessage("Số tín chỉ phải lớn hơn 0");
      return false;
    }

    return true;
  };

  /* ---------------------------------------------------------
     Thêm hoặc cập nhật môn học
  --------------------------------------------------------- */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setSuccessMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        subject_code: formData.subject_code.trim(),
        subject_name: formData.subject_name.trim(),
        credits: Number(formData.credits),
        description: formData.description?.trim() || null,
      };

      const isAddMode = modalMode === "add";

      const url = isAddMode
        ? `${API_URL}/subjects`
        : `${API_URL}/subjects/${formData.id_subject}`;

      const method = isAddMode ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await handleResponse(response);

      closeModal();

      setSuccessMessage(
        isAddMode
          ? "Thêm môn học thành công"
          : "Cập nhật môn học thành công"
      );

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu môn học:", error);
      setMessage(error.message || "Lưu môn học thất bại");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------
     Xóa môn học
     Backend sẽ chặn xóa nếu môn học đang được dùng trong courseclass.
  --------------------------------------------------------- */
  const handleDelete = async (subject) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa môn học ${subject.subject_code} - ${subject.subject_name} không?`
    );

    if (!confirmDelete) return;

    try {
      setMessage("");
      setSuccessMessage("");

      const response = await fetch(`${API_URL}/subjects/${subject.id_subject}`, {
        method: "DELETE",
      });

      await handleResponse(response);

      setSuccessMessage("Xóa môn học thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa môn học:", error);
      setMessage(error.message || "Xóa môn học thất bại");
    }
  };

  /* ---------------------------------------------------------
     Xuất danh sách môn học hiện tại ra CSV
  --------------------------------------------------------- */
  const exportCSV = () => {
    const headers = [
      "Ma mon",
      "Ten mon hoc",
      "So tin chi",
      "So lop hoc phan",
      "So lop dang mo",
      "Giao vien phu trach",
      "Trang thai",
      "Mo ta",
    ];

    const rows = subjects.map((item) => [
      item.subject_code || "",
      item.subject_name || "",
      item.credits || "",
      item.total_course_classes || 0,
      item.open_course_classes || 0,
      item.teacher_names || "",
      getStatusLabel(item.teaching_status),
      item.description || "",
    ]);

    downloadCSV("danh-sach-mon-hoc.csv", headers, rows);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="subjects" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* HERO */}
          <section className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <p className="text-sm font-semibold text-blue-100">
                  Quản trị hệ thống
                </p>

                <h1 className="mt-2 text-3xl md:text-4xl font-black">
                  Quản lý môn học
                </h1>

                <p className="mt-2 max-w-3xl text-sm md:text-base text-blue-50">
                  Quản lý mã môn, tên môn học, số tín chỉ, lớp học phần đang mở
                  và giáo viên phụ trách.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add
                  </span>
                  Thêm môn học
                </button>
              </div>
            </div>
          </section>

          {/* ALERT */}
          {message && (
            <AlertMessage
              type="error"
              icon="error"
              message={message}
              onClose={() => setMessage("")}
            />
          )}

          {successMessage && (
            <AlertMessage
              type="success"
              icon="check_circle"
              message={successMessage}
              onClose={() => setSuccessMessage("")}
            />
          )}

          {/* STATS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {statCards.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </section>

          {/* TABLE CARD */}
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* FILTER */}
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                  <div className="relative md:col-span-2">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>

                    <input
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                      placeholder="Tìm mã môn, tên môn, mô tả..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ACTIVE">Đang giảng dạy</option>
                    <option value="INACTIVE">Tạm ngưng</option>
                  </select>

                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="credits_desc">Tín chỉ giảm dần</option>
                    <option value="credits_asc">Tín chỉ tăng dần</option>
                    <option value="name_az">Tên A-Z</option>
                    <option value="name_za">Tên Z-A</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      filter_alt_off
                    </span>
                    Xóa lọc
                  </button>

                  <button
                    type="button"
                    onClick={exportCSV}
                    disabled={subjects.length === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    Xuất CSV
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <TableHead>Mã môn</TableHead>
                    <TableHead>Tên môn học</TableHead>
                    <TableHead>Số tín chỉ</TableHead>
                    <TableHead>Lớp học phần</TableHead>
                    <TableHead>Giáo viên phụ trách</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead right>Thao tác</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <TableState
                      colSpan={7}
                      icon="progress_activity"
                      title="Đang tải danh sách môn học..."
                    />
                  ) : subjects.length === 0 ? (
                    <TableState
                      colSpan={7}
                      icon="menu_book"
                      title="Không có môn học nào"
                      description="Thử thay đổi bộ lọc hoặc thêm môn học mới."
                    />
                  ) : (
                    subjects.map((subject) => (
                      <SubjectRow
                        key={subject.id_subject}
                        subject={subject}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-t border-slate-200 bg-white p-5">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị{" "}
                <span className="font-bold text-slate-800">
                  {subjects.length}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-slate-800">
                  {pagination.total || 0}
                </span>{" "}
                môn học
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>

                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-black text-white">
                  {page}
                </span>

                <span className="text-sm font-semibold text-slate-500">
                  / {pagination.totalPages || 1}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages || 1)
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </section>

          {showModal && (
            <SubjectModal
              mode={modalMode}
              formData={formData}
              saving={saving}
              onChange={handleChange}
              onClose={closeModal}
              onSubmit={handleSubmit}
            />
          )}
        </main>
      </div>
    </div>
  );
}


/* =========================================================
   4. COMPONENT CON
========================================================= */

function AlertMessage({ type, icon, message, onClose }) {
  const className =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        <span>{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-white/60"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

function StatCard({ item }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {item.title}
          </p>

          <p className="mt-3 text-4xl font-black text-slate-900">
            {item.value}
          </p>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconClass}`}
        >
          <span className="material-symbols-outlined text-[28px]">
            {item.icon}
          </span>
        </div>
      </div>
    </div>
  );
}

function SubjectRow({ subject, onEdit, onDelete }) {
  const firstTeacher = subject.teacher_names?.split(",")[0]?.trim() || "";

  return (
    <tr className="h-[72px] transition hover:bg-slate-50">
      <td className="p-4">
        <span className="font-black text-slate-900">
          {subject.subject_code}
        </span>
      </td>

      <td className="p-4">
        <div className="font-bold text-slate-900">{subject.subject_name}</div>

        {subject.description && (
          <div className="mt-1 max-w-md truncate text-xs font-medium text-slate-500">
            {subject.description}
          </div>
        )}
      </td>

      <td className="p-4">
        <span className="inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
          {subject.credits} tín chỉ
        </span>
      </td>

      <td className="p-4 text-slate-600">
        <div className="font-bold">
          {subject.total_course_classes || 0} lớp
        </div>

        <div className="text-xs text-slate-400">
          {subject.open_course_classes || 0} lớp đang mở
        </div>
      </td>

      <td className="p-4">
        {subject.teacher_names ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
              {getInitials(firstTeacher)}
            </div>

            <span className="max-w-[260px] truncate font-semibold text-slate-800">
              {subject.teacher_names}
            </span>
          </div>
        ) : (
          <span className="text-sm italic text-slate-400">
            Chưa có lớp học phần
          </span>
        )}
      </td>

      <td className="p-4">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
            subject.teaching_status
          )}`}
        >
          {getStatusLabel(subject.teaching_status)}
        </span>
      </td>

      <td className="p-4 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(subject)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
            title="Sửa môn học"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(subject)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700"
            title="Xóa môn học"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function SubjectModal({
  mode,
  formData,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  const isAddMode = mode === "add";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {isAddMode ? "Thêm môn học mới" : "Chỉnh sửa môn học"}
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Nhập mã môn, tên môn, số tín chỉ và mô tả môn học.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Mã môn học"
              name="subject_code"
              value={formData.subject_code}
              onChange={onChange}
              placeholder="Ví dụ: CS101"
              required
            />

            <Input
              label="Số tín chỉ"
              name="credits"
              type="number"
              min="1"
              value={formData.credits}
              onChange={onChange}
              placeholder="Ví dụ: 3"
              required
            />

            <div className="md:col-span-2">
              <Input
                label="Tên môn học"
                name="subject_name"
                value={formData.subject_name}
                onChange={onChange}
                placeholder="Ví dụ: Nhập môn lập trình"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Mô tả
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={onChange}
                rows="4"
                placeholder="Nhập mô tả môn học..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              {saving
                ? "Đang lưu..."
                : isAddMode
                ? "Thêm môn học"
                : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  min,
  value = "",
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        type={type}
        min={min}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th
      className={`p-4 text-xs font-black uppercase tracking-wide text-slate-500 ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function TableState({ colSpan, icon, title, description = "" }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <span className="material-symbols-outlined text-[28px]">
              {icon}
            </span>
          </div>

          <p className="font-black text-slate-700">{title}</p>

          {description && (
            <p className="text-sm font-medium text-slate-400">
              {description}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}