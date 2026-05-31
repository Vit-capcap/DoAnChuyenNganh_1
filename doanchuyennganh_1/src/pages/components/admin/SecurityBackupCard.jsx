import { ToggleRow } from "./SettingControls";

export default function SecurityBackupCard({
  settings,
  backingUp,
  formatDateTime,
  onChange,
  onBackup,
  onOpenLogs,
}) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
      <SectionTitle icon="security" title="Bảo mật & Backup" />

      <div className="space-y-5">
        <ToggleRow
          title="Xác thực 2 yếu tố 2FA"
          description="Bắt buộc cho tài khoản Admin."
          checked={settings.security_admin_2fa}
          onChange={(checked) => onChange("security_admin_2fa", checked)}
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Sao lưu dữ liệu
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBackup}
              disabled={backingUp}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  backingUp ? "animate-spin" : ""
                }`}
              >
                {backingUp ? "progress_activity" : "cloud_download"}
              </span>
              {backingUp ? "Đang backup..." : "Backup Database"}
            </button>

            <button
              type="button"
              onClick={onOpenLogs}
              className="px-4 py-3 rounded-2xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            >
              Lịch sử
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-400 mt-3">
            Bản sao lưu cuối: {formatDateTime(settings.backup_last_time)}
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Bảo mật quản trị và sao lưu cơ sở dữ liệu.
        </p>
      </div>
    </div>
  );
}