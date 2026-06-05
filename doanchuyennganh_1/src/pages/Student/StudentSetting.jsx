import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";

function getStudentInfo() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return {
      ...user,
      ...account,
      ...student,
      full_name:
        student?.full_name ||
        user?.full_name ||
        account?.student_name ||
        account?.full_name ||
        "Sinh viên",
      student_code:
        student?.student_code ||
        user?.student_code ||
        account?.student_code ||
        "",
      avatar:
        student?.avatar ||
        user?.avatar ||
        account?.student_avatar ||
        "",
    };
  } catch {
    return {};
  }
}

function getInitialSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("studentSettings") || "{}");

    return {
      darkMode:
        typeof saved.darkMode === "boolean"
          ? saved.darkMode
          : localStorage.getItem("theme") === "dark",
      language: saved.language || "vi",
      pushNotifications:
        typeof saved.pushNotifications === "boolean"
          ? saved.pushNotifications
          : true,
      emailNotifications:
        typeof saved.emailNotifications === "boolean"
          ? saved.emailNotifications
          : true,
      scheduleReminder:
        typeof saved.scheduleReminder === "boolean"
          ? saved.scheduleReminder
          : true,
      faceSensitivity: saved.faceSensitivity || "MEDIUM",
      autoSync:
        typeof saved.autoSync === "boolean" ? saved.autoSync : true,
    };
  } catch {
    return {
      darkMode: false,
      language: "vi",
      pushNotifications: true,
      emailNotifications: true,
      scheduleReminder: true,
      faceSensitivity: "MEDIUM",
      autoSync: true,
    };
  }
}

function SettingCard({ icon, title, description, children, action }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <span className="material-symbols-outlined text-[24px]">
              {icon}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>

            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </section>
  );
}

function SettingItem({ title, description, icon, button, toggle, select }) {
  return (
    <div className="flex flex-col justify-between gap-5 px-6 py-5 lg:flex-row lg:items-center">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <span className="material-symbols-outlined text-[22px]">
              {icon}
            </span>
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h4>

          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {button}
        {toggle}
        {select}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-[190px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
    >
      {children}
    </select>
  );
}

function SettingsMenu({ activeTab, onChange }) {
  const items = [
    {
      key: "account",
      icon: "person",
      label: "Tài khoản",
      description: "Bảo mật & thông tin",
    },
    {
      key: "appearance",
      icon: "palette",
      label: "Giao diện",
      description: "Chủ đề & ngôn ngữ",
    },
    {
      key: "system",
      icon: "memory",
      label: "Hệ thống AI",
      description: "Nhận diện & thông báo",
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Danh mục cài đặt
        </h3>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Chọn nhóm chức năng cần cấu hình.
        </p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-bold">{item.label}</span>
                <span
                  className={`mt-0.5 block text-xs ${
                    active ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function AiStatusCard({ settings }) {
  const sensitivityText = {
    LOW: "Nhanh",
    MEDIUM: "Cân bằng",
    HIGH: "Nghiêm ngặt",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-8 text-white shadow-lg shadow-blue-100 dark:shadow-none">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-md">
          <span className="material-symbols-outlined text-[40px]">
            verified_user
          </span>
        </div>

        <h3 className="mb-2 text-2xl font-bold">AI Biometrics</h3>

        <p className="mb-5 text-sm text-blue-100">
          Hệ thống nhận diện khuôn mặt đang hoạt động và sẵn sàng điểm danh.
        </p>

        <div className="mb-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300" />
          <span className="text-sm font-bold">Đang hoạt động</span>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs text-blue-100">Độ nhạy</p>
            <p className="mt-1 text-sm font-bold">
              {sensitivityText[settings.faceSensitivity] || "Cân bằng"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-3">
            <p className="text-xs text-blue-100">Đồng bộ</p>
            <p className="mt-1 text-sm font-bold">
              {settings.autoSync ? "Bật" : "Tắt"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessAlert({ message }) {
  if (!message) return null;

  return (
    <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
      <span className="material-symbols-outlined text-[20px]">
        check_circle
      </span>
      <span>{message}</span>
    </div>
  );
}

export default function StudentSettings() {
  const navigate = useNavigate();

  const [student] = useState(() => getStudentInfo());
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState(() => getInitialSettings());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const root = document.documentElement;

    if (settings.darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [settings.darkMode]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setMessage("");
  };

  const saveSettings = () => {
    localStorage.setItem("studentSettings", JSON.stringify(settings));
    setMessage("Đã lưu cài đặt thành công.");
  };

  const resetSettings = () => {
    const defaultSettings = {
      darkMode: false,
      language: "vi",
      pushNotifications: true,
      emailNotifications: true,
      scheduleReminder: true,
      faceSensitivity: "MEDIUM",
      autoSync: true,
    };

    setSettings(defaultSettings);
    localStorage.setItem("studentSettings", JSON.stringify(defaultSettings));
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("dark");
    setMessage("Đã khôi phục cài đặt mặc định.");
  };

  const languageLabel = useMemo(() => {
    if (settings.language === "en") return "English";
    if (settings.language === "ja") return "Japanese";
    return "Tiếng Việt";
  }, [settings.language]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="settings" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={student} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    settings
                  </span>
                  Cài đặt sinh viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Cài đặt & tùy chọn
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Quản lý tài khoản, giao diện, thông báo và cấu hình nhận diện
                  khuôn mặt.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/dashboard")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    dashboard
                  </span>
                  Trang chủ
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    save
                  </span>
                  Lưu cài đặt
                </button>
              </div>
            </div>
          </div>

          <SuccessAlert message={message} />

          <div className="mx-auto max-w-[1500px]">
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  <span className="material-symbols-outlined">language</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {languageLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ngôn ngữ hiển thị
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.darkMode ? "Dark" : "Light"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Chế độ giao diện
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="material-symbols-outlined">
                    notifications
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.pushNotifications ? "Bật" : "Tắt"}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Thông báo đẩy
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                  <span className="material-symbols-outlined">
                    face_retouching_natural
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.faceSensitivity}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Độ nhạy nhận diện
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-4">
                <SettingsMenu activeTab={activeTab} onChange={setActiveTab} />
                <AiStatusCard settings={settings} />
              </div>

              <div className="space-y-6 xl:col-span-8">
                {activeTab === "account" && (
                  <SettingCard
                    icon="person"
                    title="Tài khoản"
                    description="Quản lý hồ sơ cá nhân và bảo mật tài khoản."
                  >
                    <SettingItem
                      icon="account_circle"
                      title="Thông tin cá nhân"
                      description="Xem và cập nhật họ tên, ngày sinh, giới tính, số điện thoại."
                      button={
                        <button
                          type="button"
                          onClick={() => navigate("/student/profile")}
                          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-blue-950"
                        >
                          Mở hồ sơ
                        </button>
                      }
                    />

                    <SettingItem
                      icon="key"
                      title="Đổi mật khẩu"
                      description="Cập nhật mật khẩu định kỳ để bảo vệ tài khoản sinh viên."
                      button={
                        <button
                          type="button"
                          onClick={() => navigate("/student/change-password")}
                          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          Đổi mật khẩu
                        </button>
                      }
                    />

                    <SettingItem
                      icon="mail"
                      title="Thông báo qua email"
                      description="Nhận email khi có lịch học, điểm danh hoặc thông báo mới."
                      toggle={
                        <ToggleSwitch
                          checked={settings.emailNotifications}
                          onChange={(value) =>
                            updateSetting("emailNotifications", value)
                          }
                        />
                      }
                    />
                  </SettingCard>
                )}

                {activeTab === "appearance" && (
                  <SettingCard
                    icon="palette"
                    title="Giao diện"
                    description="Tùy chỉnh chế độ hiển thị và ngôn ngữ sử dụng."
                  >
                    <SettingItem
                      icon="dark_mode"
                      title="Chế độ tối"
                      description="Bật giao diện nền tối để giảm mỏi mắt khi sử dụng ban đêm."
                      toggle={
                        <ToggleSwitch
                          checked={settings.darkMode}
                          onChange={(value) =>
                            updateSetting("darkMode", value)
                          }
                        />
                      }
                    />

                    <SettingItem
                      icon="language"
                      title="Ngôn ngữ"
                      description="Chọn ngôn ngữ hiển thị cho cổng sinh viên."
                      select={
                        <SelectInput
                          value={settings.language}
                          onChange={(value) => updateSetting("language", value)}
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                          <option value="ja">Japanese</option>
                        </SelectInput>
                      }
                    />
                  </SettingCard>
                )}

                {activeTab === "system" && (
                  <SettingCard
                    icon="memory"
                    title="Hệ thống & AI"
                    description="Cấu hình thông báo, đồng bộ và nhận diện khuôn mặt."
                    action={
                      <button
                        type="button"
                        onClick={resetSettings}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                      >
                        Khôi phục mặc định
                      </button>
                    }
                  >
                    <SettingItem
                      icon="notifications"
                      title="Thông báo đẩy"
                      description="Nhận cảnh báo khi có lịch học, thay đổi điểm danh hoặc thông báo hệ thống."
                      toggle={
                        <ToggleSwitch
                          checked={settings.pushNotifications}
                          onChange={(value) =>
                            updateSetting("pushNotifications", value)
                          }
                        />
                      }
                    />

                    <SettingItem
                      icon="event_available"
                      title="Nhắc lịch học"
                      description="Bật nhắc lịch trước buổi học để không bỏ lỡ thời gian điểm danh."
                      toggle={
                        <ToggleSwitch
                          checked={settings.scheduleReminder}
                          onChange={(value) =>
                            updateSetting("scheduleReminder", value)
                          }
                        />
                      }
                    />

                    <SettingItem
                      icon="sync"
                      title="Tự động đồng bộ"
                      description="Tự động đồng bộ dữ liệu điểm danh và thông báo mới nhất."
                      toggle={
                        <ToggleSwitch
                          checked={settings.autoSync}
                          onChange={(value) =>
                            updateSetting("autoSync", value)
                          }
                        />
                      }
                    />

                    <SettingItem
                      icon="face"
                      title="Độ nhạy nhận diện khuôn mặt"
                      description="Điều chỉnh mức độ kiểm tra độ tin cậy khi nhận diện khuôn mặt."
                      select={
                        <SelectInput
                          value={settings.faceSensitivity}
                          onChange={(value) =>
                            updateSetting("faceSensitivity", value)
                          }
                        >
                          <option value="LOW">Thấp - nhanh hơn</option>
                          <option value="MEDIUM">Trung bình - cân bằng</option>
                          <option value="HIGH">Cao - nghiêm ngặt</option>
                        </SelectInput>
                      }
                    />

                    <div className="px-6 py-5">
                      <button
                        type="button"
                        onClick={saveSettings}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          save
                        </span>
                        Lưu thay đổi hệ thống
                      </button>
                    </div>
                  </SettingCard>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}