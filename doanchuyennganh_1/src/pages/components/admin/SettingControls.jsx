export function Input({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}

export function Toggle({ checked = false, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />

      <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
    </label>
  );
}

export function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200">
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          {description}
        </p>
      </div>

      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export function ToggleSimple({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}