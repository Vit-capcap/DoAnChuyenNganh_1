export default function SchoolSettingsCard({
  settings,
  onChange,
  onLogoChange,
}) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-6 border border-slate-200">
      <SectionTitle icon="account_balance" title="Thông tin trường học" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Tên trường"
          value={settings.school_name}
          onChange={(value) => onChange("school_name", value)}
          placeholder="Nhập tên trường"
        />

        <Input
          label="Địa chỉ"
          value={settings.school_address}
          onChange={(value) => onChange("school_address", value)}
          placeholder="Nhập địa chỉ trường"
        />

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
            Logo hệ thống
          </label>

          <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-slate-50 border border-slate-200 p-4">
            <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
              {settings.school_logo ? (
                <img
                  src={settings.school_logo}
                  alt="Logo hệ thống"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-slate-400 text-[34px]">
                  school
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-100 cursor-pointer transition">
                Tải lên logo mới
                <input
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => onChange("school_logo", "")}
                className="px-4 py-2.5 rounded-2xl border border-red-100 text-red-600 bg-white text-sm font-bold hover:bg-red-50 transition"
              >
                Xóa logo
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              JPG, PNG. Tối đa 2MB.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Cấu hình thông tin hiển thị của hệ thống.
        </p>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}