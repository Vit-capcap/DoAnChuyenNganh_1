import { ToggleRow } from "./SettingControls";

export default function AISettingsCard({ settings, onChange }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 border border-blue-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-50/40" />

      <div className="relative z-10">
        <SectionTitle icon="memory" title="Cấu hình AI nhận diện" />

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">
                Độ tin cậy
              </label>

              <span className="text-sm font-black text-blue-600">
                {settings.ai_confidence_threshold}%
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="100"
              value={settings.ai_confidence_threshold}
              onChange={(e) =>
                onChange("ai_confidence_threshold", Number(e.target.value))
              }
              className="w-full accent-blue-600"
            />

            <p className="text-xs font-semibold text-slate-500 mt-2">
              Ngưỡng tối thiểu để hệ thống ghi nhận khuôn mặt khớp với dữ liệu.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Độ nhạy phát hiện khuôn mặt
            </label>

            <div className="relative">
              <select
                value={settings.ai_face_sensitivity}
                onChange={(e) =>
                  onChange("ai_face_sensitivity", e.target.value)
                }
                className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình - Khuyên dùng</option>
                <option value="HIGH">Cao</option>
              </select>

              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <ToggleRow
            title="Cảnh báo người lạ"
            description="Ghi hình và thông báo khi có khuôn mặt không xác định."
            checked={settings.ai_unknown_face_alert}
            onChange={(checked) => onChange("ai_unknown_face_alert", checked)}
          />
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-blue-700">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Cấu hình độ chính xác và cảnh báo AI.
        </p>
      </div>
    </div>
  );
}