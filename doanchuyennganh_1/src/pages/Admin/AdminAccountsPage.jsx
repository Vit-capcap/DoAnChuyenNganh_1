import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import AccountStats from "../components/admin/AccountStats";
import AccountFilters from "../components/admin/AccountFilters";
import AccountTable from "../components/admin/AccountTable";
import AccountModal from "../components/admin/AccountModal";

import {
  getAccountOptions,
  getAccounts,
  createAccount,
  updateAccount,
  updateAccountStatus,
  deleteAccountById,
} from "../../api/accountApi";

const initialForm = {
  id_account: "",
  username: "",
  password: "",
  role: "STUDENT",
  teacher_id: "",
  student_id: "",
  status: "ACTIVE",
};

const defaultStats = {
  total_accounts: 0,
  admin_count: 0,
  teacher_count: 0,
  student_count: 0,
  locked_count: 0,
};

const roleLabels = {
  ADMIN: "Admin",
  TEACHER: "Giáo viên",
  STUDENT: "Sinh viên",
};

const roleClass = {
  ADMIN: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  TEACHER: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
  STUDENT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

function getInitials(name) {
  if (!name) return "ND";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getAvatar(account) {
  if (account.display_avatar) return account.display_avatar;

  const name = encodeURIComponent(account.display_name || account.username);
  return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=ffffff`;
}

function formatDateTime(value) {
  if (!value) return "Chưa đăng nhập";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa đăng nhập";
  }

  return date.toLocaleString("vi-VN");
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [stats, setStats] = useState(defaultStats);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        const data = await getAccountOptions();

        if (!isMounted) return;

        setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
        setStudents(Array.isArray(data.students) ? data.students : []);
      } catch (error) {
        console.error("Lỗi tải options:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu người dùng");
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      try {
        const data = await getAccounts({
          search,
          role: roleFilter,
          status: statusFilter,
          page,
          limit: 10,
        });

        if (!isMounted) return;

        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
        setStats(data.stats || defaultStats);
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
        console.error("Lỗi tải tài khoản:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách tài khoản");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadAccounts();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [search, roleFilter, statusFilter, page, refreshKey]);

  const statCards = useMemo(
    () => [
      {
        title: "Tổng tài khoản",
        value: stats.total_accounts || 0,
        icon: "group",
        note: "Tất cả tài khoản",
        textClass: "text-slate-900",
        bgClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Admin",
        value: stats.admin_count || 0,
        icon: "admin_panel_settings",
        textClass: "text-indigo-600",
        bgClass: "bg-indigo-50 text-indigo-600",
      },
      {
        title: "Giáo viên",
        value: stats.teacher_count || 0,
        icon: "badge",
        textClass: "text-purple-600",
        bgClass: "bg-purple-50 text-purple-600",
      },
      {
        title: "Sinh viên",
        value: stats.student_count || 0,
        icon: "school",
        textClass: "text-emerald-600",
        bgClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Bị khóa",
        value: stats.locked_count || 0,
        icon: "lock",
        textClass: "text-rose-600",
        bgClass: "bg-rose-50 text-rose-600",
      },
    ],
    [stats]
  );

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setShowPassword(false);
    setShowModal(true);
    setMessage("");
  };

  const openEditModal = (account) => {
    setModalMode("edit");

    setFormData({
      id_account: account.id_account || "",
      username: account.username || "",
      password: "",
      role: account.role || "STUDENT",
      teacher_id: account.teacher_id || "",
      student_id: account.student_id || "",
      status: account.status || "ACTIVE",
    });

    setShowPassword(false);
    setShowModal(true);
    setMessage("");
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialForm);
    setShowPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: value,
      };

      if (name === "role") {
        nextData.teacher_id = "";
        nextData.student_id = "";
      }

      return nextData;
    });
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setMessage("Vui lòng nhập username");
      return false;
    }

    if (modalMode === "add" && !formData.password.trim()) {
      setMessage("Vui lòng nhập mật khẩu");
      return false;
    }

    if (formData.password && formData.password.length < 8) {
      setMessage("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }

    if (formData.role === "TEACHER" && !formData.teacher_id) {
      setMessage("Vui lòng chọn giáo viên");
      return false;
    }

    if (formData.role === "STUDENT" && !formData.student_id) {
      setMessage("Vui lòng chọn sinh viên");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role,
      teacher_id: formData.role === "TEACHER" ? formData.teacher_id : null,
      student_id: formData.role === "STUDENT" ? formData.student_id : null,
      status: formData.status || "ACTIVE",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (modalMode === "add") {
        await createAccount(buildPayload());
        alert("Thêm tài khoản thành công");
      } else {
        await updateAccount(formData.id_account, buildPayload());
        alert("Cập nhật tài khoản thành công");
      }

      closeModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu tài khoản:", error);
      setMessage(error.message || "Lưu tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccountStatus = async (account) => {
    const newStatus = account.status === "LOCKED" ? "ACTIVE" : "LOCKED";

    const confirmMessage =
      newStatus === "LOCKED"
        ? `Bạn có chắc chắn muốn khóa tài khoản ${account.username} không?`
        : `Bạn có chắc chắn muốn mở khóa tài khoản ${account.username} không?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const data = await updateAccountStatus(account.id_account, newStatus);

      alert(data.message || "Cập nhật trạng thái thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi đổi trạng thái:", error);
      setMessage(error.message || "Cập nhật trạng thái thất bại");
    }
  };

  const deleteAccount = async (account) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa tài khoản ${account.username} không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteAccountById(account.id_account);

      alert("Xóa tài khoản thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
      setMessage(error.message || "Xóa tài khoản thất bại");
    }
  };

  const exportCSV = () => {
    const headers = [
      "Username",
      "Vai tro",
      "Trang thai",
      "Nguoi dung",
      "Email",
      "Ma nguoi dung",
      "Dang nhap cuoi",
    ];

    const rows = accounts.map((item) => [
      item.username || "",
      roleLabels[item.role] || item.role,
      item.status === "LOCKED" ? "Bi khoa" : "Hoat dong",
      item.display_name || "",
      item.display_email || "",
      item.user_code || "",
      formatDateTime(item.last_login),
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
    link.download = "danh-sach-tai-khoan.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="accounts" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    manage_accounts
                  </span>
                  Quản trị tài khoản
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Quản lý tài khoản
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Quản lý tài khoản đăng nhập, vai trò và trạng thái người dùng
                  trong hệ thống điểm danh khuôn mặt.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  disabled={accounts.length === 0}
                  className="bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add
                  </span>
                  Thêm tài khoản
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <AccountStats statCards={statCards} />

          <AccountFilters
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onReset={resetFilters}
            onPageReset={() => setPage(1)}
          />

          <AccountTable
            accounts={accounts}
            loading={loading}
            pagination={pagination}
            page={page}
            setPage={setPage}
            roleLabels={roleLabels}
            roleClass={roleClass}
            formatDateTime={formatDateTime}
            getInitials={getInitials}
            getAvatar={getAvatar}
            onEdit={openEditModal}
            onToggleStatus={toggleAccountStatus}
            onDelete={deleteAccount}
          />
        </main>
      </div>

      {showModal && (
        <AccountModal
          mode={modalMode}
          formData={formData}
          teachers={teachers}
          students={students}
          showPassword={showPassword}
          saving={saving}
          onChange={handleChange}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}