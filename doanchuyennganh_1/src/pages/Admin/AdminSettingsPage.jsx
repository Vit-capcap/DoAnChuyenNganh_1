import { useEffect, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import SchoolSettingsCard from "../components/admin/SchoolSettingsCard";
import AISettingsCard from "../components/admin/AISettingsCard";
import AttendanceSettingsCard from "../components/admin/AttendanceSettingsCard";
import NotificationSettingsCard from "../components/admin/NotificationSettingsCard";
import SecurityBackupCard from "../components/admin/SecurityBackupCard";
import LogsModal from "../components/admin/LogsModal";

import {
  getSettings,
  getSettingLogs,
  updateSettings,
  resetSettings,
  backupSettingsDatabase,
} from "../../api/settingsApi";

const defaultSettings = {
  school_name: "",
  school_address: "",
  school_logo: "",

  ai_confidence_threshold: 85,
  ai_face_sensitivity: "MEDIUM",
  ai_unknown_face_alert: true,

  attendance_start_time: "07:00",
  attendance_end_time: "17:30",
  attendance_late_threshold: 15,
  attendance_auto_absent: true,

  notification_daily_email: true,
  notification_late_absent_alert: true,
  notification_weekly_report: false,

  security_admin_2fa: true,
  backup_last_time: "",
};

function formatDateTime(value) {
  if (!value) return "Chưa có bản sao lưu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có bản sao lưu";
  }

  return date.toLocaleString("vi-VN");
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState(defaultSettings);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const [settingsData, logsData] = await Promise.all([
          getSettings(),
          getSettingLogs(),
        ]);

        if (!isMounted) return;

        const loadedSettings = {
          ...defaultSettings,
          ...(settingsData.settings || {}),
        };

        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
        setLogs(Array.isArray(logsData) ? logsData : []);
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải cài đặt:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải cài đặt hệ thống");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (name, value) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Logo không được vượt quá 2MB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      handleChange("school_logo", reader.result);
    };

    reader.readAsDataURL(file);
  };

  const validateSettings = () => {
    if (!settings.school_name.trim()) {
      setMessage("Vui lòng nhập tên trường");
      return false;
    }

    if (!settings.school_address.trim()) {
      setMessage("Vui lòng nhập địa chỉ trường");
      return false;
    }

    const confidence = Number(settings.ai_confidence_threshold);

    if (Number.isNaN(confidence) || confidence < 50 || confidence > 100) {
      setMessage("Độ tin cậy AI phải nằm trong khoảng 50 - 100");
      return false;
    }

    if (settings.attendance_start_time >= settings.attendance_end_time) {
      setMessage("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
      return false;
    }

    const lateThreshold = Number(settings.attendance_late_threshold);

    if (Number.isNaN(lateThreshold) || lateThreshold < 0) {
      setMessage("Ngưỡng đi muộn phải lớn hơn hoặc bằng 0");
      return false;
    }

    return true;
  };

  const refreshLogs = async () => {
    try {
      const data = await getSettingLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải lịch sử:", error);
    }
  };

  const saveSettings = async () => {
    setMessage("");

    if (!validateSettings()) return;

    try {
      setSaving(true);

      const payload = {
        ...settings,
        ai_confidence_threshold: Number(settings.ai_confidence_threshold),
        attendance_late_threshold: Number(settings.attendance_late_threshold),
      };

      await updateSettings(payload);

      alert("Lưu cài đặt thành công");
      setOriginalSettings(settings);
      refreshLogs();
    } catch (error) {
      console.error("Lỗi lưu cài đặt:", error);
      setMessage(error.message || "Lưu cài đặt thất bại");
    } finally {
      setSaving(false);
    }
  };

  const resetLocalChanges = () => {
    setSettings(originalSettings);
    setMessage("");
  };

  const resetDefaultSettings = async () => {
    const confirmReset = window.confirm(
      "Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt về mặc định không?"
    );

    if (!confirmReset) return;

    try {
      setSaving(true);
      setMessage("");

      const data = await resetSettings();

      const nextSettings = {
        ...defaultSettings,
        ...(data.settings || {}),
      };

      setSettings(nextSettings);
      setOriginalSettings(nextSettings);

      alert("Đặt lại cài đặt mặc định thành công");
      refreshLogs();
    } catch (error) {
      console.error("Lỗi đặt lại cài đặt:", error);
      setMessage(error.message || "Đặt lại cài đặt thất bại");
    } finally {
      setSaving(false);
    }
  };

  const backupDatabase = async () => {
    const confirmBackup = window.confirm(
      "Bạn có chắc chắn muốn backup database không?"
    );

    if (!confirmBackup) return;

    try {
      setBackingUp(true);
      setMessage("");

      const data = await backupSettingsDatabase();

      setSettings((prev) => ({
        ...prev,
        backup_last_time: data.backup_last_time,
      }));

      setOriginalSettings((prev) => ({
        ...prev,
        backup_last_time: data.backup_last_time,
      }));

      alert("Backup database thành công");
      refreshLogs();
    } catch (error) {
      console.error("Lỗi backup database:", error);
      setMessage(error.message || "Backup database thất bại");
    } finally {
      setBackingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="settings" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải cài đặt hệ thống...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="settings" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    settings
                  </span>
                  Cấu hình hệ thống
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Cài đặt hệ thống
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Quản lý cấu hình toàn cục cho hệ thống AI nhận diện khuôn mặt,
                  điểm danh, thông báo, bảo mật và backup.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetLocalChanges}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    undo
                  </span>
                  Hoàn tác
                </button>

                <button
                  type="button"
                  onClick={resetDefaultSettings}
                  disabled={saving}
                  className="bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    restart_alt
                  </span>
                  Mặc định
                </button>

                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      saving ? "animate-spin" : ""
                    }`}
                  >
                    {saving ? "progress_activity" : "save"}
                  </span>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
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

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-12">
              <SchoolSettingsCard
                settings={settings}
                onChange={handleChange}
                onLogoChange={handleLogoChange}
              />
            </div>

            <div className="xl:col-span-6">
              <AISettingsCard settings={settings} onChange={handleChange} />
            </div>

            <div className="xl:col-span-6">
              <AttendanceSettingsCard
                settings={settings}
                onChange={handleChange}
              />
            </div>

            <div className="xl:col-span-6">
              <NotificationSettingsCard
                settings={settings}
                onChange={handleChange}
              />
            </div>

            <div className="xl:col-span-6">
              <SecurityBackupCard
                settings={settings}
                backingUp={backingUp}
                formatDateTime={formatDateTime}
                onChange={handleChange}
                onBackup={backupDatabase}
                onOpenLogs={() => setShowLogs(true)}
              />
            </div>
          </div>

          {showLogs && (
            <LogsModal
              logs={logs}
              formatDateTime={formatDateTime}
              onClose={() => setShowLogs(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}