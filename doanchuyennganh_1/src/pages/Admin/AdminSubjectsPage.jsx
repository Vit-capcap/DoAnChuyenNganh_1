import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

const initialForm = {
  id_subject: "",
  subject_code: "",
  subject_name: "",
  credits: 3,
  description: "",
};

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

function getStatusLabel(status) {
  if (status === "ACTIVE") return "Đang giảng dạy";
  return "Tạm ngưng";
}

function getStatusClass(status) {
  if (status === "ACTIVE") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-red-50 text-red-600";
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    total_subjects: 0,
    active_subjects: 0,
    average_credits: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSubjects = async () => {
      try {
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

        const res = await fetch(`${API_URL}/subjects?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Không thể tải danh sách môn học");
        }

        if (isMounted) {
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
        }
      } catch (error) {
        console.error("Lỗi tải môn học:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách môn học");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadSubjects();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [search, statusFilter, sort, page, refreshKey]);

  const statCards = useMemo(
    () => [
      {
        title: "Tổng số môn học",
        value: stats.total_subjects || 0,
        icon: "menu_book",
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Đang giảng dạy",
        value: stats.active_subjects || 0,
        icon: "check_circle",
        iconClass: "bg-emerald-100 text-emerald-600",
      },
      {
        title: "Số tín chỉ trung bình",
        value: stats.average_credits || 0,
        icon: "functions",
        iconClass: "bg-indigo-100 text-indigo-600",
      },
    ],
    [stats]
  );

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSort("newest");
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setShowModal(true);
    setMessage("");
  };

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
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        subject_code: formData.subject_code,
        subject_name: formData.subject_name,
        credits: Number(formData.credits),
        description: formData.description || null,
      };

      const url =
        modalMode === "add"
          ? `${API_URL}/subjects`
          : `${API_URL}/subjects/${formData.id_subject}`;

      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lưu môn học thất bại");
      }

      alert(
        modalMode === "add"
          ? "Thêm môn học thành công"
          : "Cập nhật môn học thành công"
      );

      closeModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu môn học:", error);
      setMessage(error.message || "Lưu môn học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa môn học ${subject.subject_code} - ${subject.subject_name} không?`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/subjects/${subject.id_subject}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xóa môn học thất bại");
      }

      alert("Xóa môn học thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa môn học:", error);
      setMessage(error.message || "Xóa môn học thất bại");
    }
  };

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

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "danh-sach-mon-hoc.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
      <Sidebar activePage="subjects" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Quản lý môn học
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Quản lý danh sách môn học, số tín chỉ và lớp học phần liên quan.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                add
              </span>
              Thêm môn học mới
            </button>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {statCards.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between border border-gray-200 hover:-translate-y-1 hover:shadow-md transition"
              >
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    {item.title}
                  </p>

                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${item.iconClass}`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>

                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Tìm mã môn, tên môn..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 text-sm rounded-xl focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-gray-700 outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 w-full md:w-auto text-gray-700 outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang giảng dạy</option>
                  <option value="INACTIVE">Tạm ngưng</option>
                </select>

                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 w-full md:w-auto text-gray-700 outline-none"
                >
                  <option value="newest">Sắp xếp: Mới nhất</option>
                  <option value="credits_desc">Số tín chỉ: Giảm dần</option>
                  <option value="credits_asc">Số tín chỉ: Tăng dần</option>
                  <option value="name_az">Tên: A-Z</option>
                  <option value="name_za">Tên: Z-A</option>
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-semibold text-gray-600 hover:bg-gray-100 px-4 py-3 rounded-xl transition"
                >
                  Xóa lọc
                </button>
              </div>

              <button
                type="button"
                onClick={exportCSV}
                className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <TableHead>Mã môn</TableHead>
                    <TableHead>Tên môn học</TableHead>
                    <TableHead>Số tín chỉ</TableHead>
                    <TableHead>Số lớp HP</TableHead>
                    <TableHead>Giáo viên phụ trách</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead right>Thao tác</TableHead>
                  </tr>
                </thead>

                <tbody className="text-sm divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-gray-500 font-semibold"
                      >
                        Đang tải danh sách môn học...
                      </td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="p-8 text-center text-gray-500 font-semibold"
                      >
                        Không có môn học nào.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((subject) => {
                      const firstTeacher =
                        subject.teacher_names?.split(",")[0]?.trim() || "";

                      return (
                        <tr
                          key={subject.id_subject}
                          className="hover:bg-gray-50 transition h-[64px]"
                        >
                          <td className="p-4 text-gray-900 font-semibold">
                            {subject.subject_code}
                          </td>

                          <td className="p-4">
                            <div className="text-gray-900 font-semibold">
                              {subject.subject_name}
                            </div>

                            {subject.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {subject.description}
                              </div>
                            )}
                          </td>

                          <td className="p-4 text-gray-500">
                            {subject.credits}
                          </td>

                          <td className="p-4 text-gray-500">
                            {subject.total_course_classes || 0}
                            <span className="text-xs text-gray-400 ml-1">
                              ({subject.open_course_classes || 0} mở)
                            </span>
                          </td>

                          <td className="p-4">
                            {subject.teacher_names ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                  {getInitials(firstTeacher)}
                                </div>

                                <span className="text-gray-900">
                                  {subject.teacher_names}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">
                                Chưa có lớp học phần
                              </span>
                            )}
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(
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
                                onClick={() => openEditModal(subject)}
                                className="text-gray-500 hover:text-blue-600 transition p-2 rounded-lg hover:bg-blue-50"
                                title="Sửa môn học"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  edit
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(subject)}
                                className="text-gray-500 hover:text-red-600 transition p-2 rounded-lg hover:bg-red-50"
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
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white">
              <span className="text-sm text-gray-500">
                Hiển thị {subjects.length} trong tổng số{" "}
                {pagination.total || 0} môn học
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_left
                  </span>
                </button>

                <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 text-white text-sm font-semibold">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages || 1)
                    )
                  }
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>

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

function SubjectModal({
  mode,
  formData,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "add" ? "Thêm môn học mới" : "Chỉnh sửa môn học"}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Nhập mã môn, tên môn, số tín chỉ và mô tả môn học.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Mô tả
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={onChange}
                rows="4"
                placeholder="Nhập mô tả môn học..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              {saving
                ? "Đang lưu..."
                : mode === "add"
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
  value = "",
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
      />
    </div>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th
      className={`p-4 text-xs font-bold text-gray-500 uppercase ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}