import { useMemo, useState } from "react";
import { changeStudentPassword } from "../../api/studentApi";

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      score: 0,
      text: "Chưa nhập mật khẩu mới",
      className: "bg-slate-200 dark:bg-slate-800",
      textClass: "text-slate-500 dark:text-slate-400",
    };
  }

  if (score <= 2) {
    return {
      score,
      text: "Mật khẩu yếu. Cần thêm chữ hoa, số hoặc ký tự đặc biệt.",
      className: "bg-red-500",
      textClass: "text-red-600 dark:text-red-300",
    };
  }

  if (score <= 4) {
    return {
      score,
      text: "Mật khẩu trung bình. Nên thêm ký tự đặc biệt để an toàn hơn.",
      className: "bg-amber-500",
      textClass: "text-amber-600 dark:text-amber-300",
    };
  }

  return {
    score,
    text: "Mật khẩu mạnh.",
    className: "bg-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-300",
  };
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </label>

      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
          lock
        </span>

        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
        />

        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-blue-600 dark:hover:text-blue-400"
        >
          <span className="material-symbols-outlined text-[20px]">
            {visible ? "visibility" : "visibility_off"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function StudentChangePasswordPanel({
  studentId,
  onCancel,
  onSuccess,
  onError,
}) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [visible, setVisible] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [saving, setSaving] = useState(false);

  const strength = useMemo(
    () => getPasswordStrength(form.newPassword),
    [form.newPassword]
  );

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleVisible = (field) => {
    setVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const resetForm = () => {
    setForm({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setVisible({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };

  const handleSubmit = async () => {
    if (!studentId) {
      onError?.("Không tìm thấy studentId. Vui lòng đăng nhập lại.");
      return;
    }

    if (!form.oldPassword.trim()) {
      onError?.("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (!form.newPassword.trim()) {
      onError?.("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (form.newPassword.length < 8) {
      onError?.("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (form.oldPassword === form.newPassword) {
      onError?.("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      onError?.("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    if (strength.score < 3) {
      onError?.(
        "Mật khẩu mới còn yếu. Vui lòng dùng chữ hoa, chữ thường, số hoặc ký tự đặc biệt."
      );
      return;
    }

    try {
      setSaving(true);
      onError?.("");

      await changeStudentPassword(studentId, {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      resetForm();
      onSuccess?.("Đổi mật khẩu thành công.");
      onCancel?.();
    } catch (error) {
      console.error("Lỗi đổi mật khẩu sinh viên:", error);
      onError?.(error.message || "Không thể đổi mật khẩu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Đổi mật khẩu
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Cập nhật mật khẩu định kỳ để bảo vệ tài khoản sinh viên.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          Đóng
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <PasswordInput
            label="Mật khẩu hiện tại"
            value={form.oldPassword}
            onChange={(value) => updateField("oldPassword", value)}
            visible={visible.oldPassword}
            onToggleVisible={() => toggleVisible("oldPassword")}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <PasswordInput
            label="Mật khẩu mới"
            value={form.newPassword}
            onChange={(value) => updateField("newPassword", value)}
            visible={visible.newPassword}
            onToggleVisible={() => toggleVisible("newPassword")}
            placeholder="Nhập mật khẩu mới"
          />

          <div>
            <div className="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className={`h-full flex-1 transition ${
                    item <= strength.score
                      ? strength.className
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                />
              ))}
            </div>

            <p
              className={`mt-2 flex items-center gap-1 text-xs font-bold ${strength.textClass}`}
            >
              <span className="material-symbols-outlined text-[16px]">
                info
              </span>
              {strength.text}
            </p>
          </div>

          <PasswordInput
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
            visible={visible.confirmPassword}
            onToggleVisible={() => toggleVisible("confirmPassword")}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <div className="lg:col-span-5">
          <div className="h-full rounded-3xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              <span className="material-symbols-outlined text-[28px]">
                security
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Khuyến nghị bảo mật
            </h4>

            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
              <li className="flex gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  check_circle
                </span>
                Mật khẩu phải dài ít nhất 8 ký tự.
              </li>

              <li className="flex gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  check_circle
                </span>
                Nên có chữ hoa, chữ thường, số và ký tự đặc biệt.
              </li>

              <li className="flex gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  check_circle
                </span>
                Không sử dụng lại mật khẩu cũ.
              </li>

              <li className="flex gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">
                  check_circle
                </span>
                Không chia sẻ mật khẩu cho người khác.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          Hủy
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]">key</span>
          {saving ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </div>
    </div>
  );
}