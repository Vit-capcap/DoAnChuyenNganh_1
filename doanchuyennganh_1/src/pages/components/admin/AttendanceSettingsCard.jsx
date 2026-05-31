import { Input, ToggleRow } from "./SettingControls";

export default function AttendanceSettingsCard({ settings, onChange }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
      <SectionTitle icon="schedule" title="Cấu hình điểm danh" />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Giờ bắt đầu"
            type="time"
            value={settings.attendance_start_time}
            onChange={(value) => onChange("attendance_start_time", value)}
          />

          <Input
            label="Giờ kết thúc"
            type="time"
            value={settings.attendance_end_time}
            onChange={(value) => onChange("attendance_end_time", value)}
          />
        </div>

        <Input
          label="Ngưỡng đi muộn / phút"
          type="number"
          value={settings.attendance_late_threshold}
          onChange={(value) =>
            onChange("attendance_late_threshold", Number(value))
          }
        />

        <ToggleRow
          title="Tự động đánh vắng"
          description="Nếu không ghi nhận điểm danh sau thời gian quy định."
          checked={settings.attendance_auto_absent}
          onChange={(checked) => onChange("attendance_auto_absent", checked)}
        />
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Quy định thời gian điểm danh và trạng thái vắng/muộn.
        </p>
      </div>
    </div>
  );
}