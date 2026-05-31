import { ToggleSimple } from "./SettingControls";

export default function NotificationSettingsCard({ settings, onChange }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
      <SectionTitle icon="notifications_active" title="Thông báo" />

      <div className="space-y-3">
        <ToggleSimple
          label="Gửi thông báo Email hàng ngày"
          checked={settings.notification_daily_email}
          onChange={(checked) => onChange("notification_daily_email", checked)}
        />

        <ToggleSimple
          label="Cảnh báo Đi muộn/Vắng mặt tức thì"
          checked={settings.notification_late_absent_alert}
          onChange={(checked) =>
            onChange("notification_late_absent_alert", checked)
          }
        />

        <ToggleSimple
          label="Báo cáo tóm tắt cuối tuần"
          checked={settings.notification_weekly_report}
          onChange={(checked) => onChange("notification_weekly_report", checked)}
        />
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Cấu hình thông báo email và cảnh báo hệ thống.
        </p>
      </div>
    </div>
  );
}