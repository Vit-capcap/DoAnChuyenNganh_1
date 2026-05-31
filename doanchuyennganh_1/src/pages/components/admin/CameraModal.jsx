export default function CameraModal({
  mode,
  formData,
  rooms,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-black">
                {mode === "add" ? "Thêm camera" : "Chỉnh sửa camera"}
              </h3>

              <p className="text-sm text-blue-100 mt-1">
                Cấu hình camera giám sát theo bảng CameraDevice trong MySQL.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Tên camera"
              name="camera_name"
              value={formData.camera_name}
              onChange={onChange}
              placeholder="Ví dụ: Cam 01 - Phòng A101"
              required
            />

            <Input
              label="IP camera"
              name="camera_ip"
              value={formData.camera_ip}
              onChange={onChange}
              placeholder="Ví dụ: 192.168.1.50 hoặc rtsp://..."
              required
            />

            <FormSelect
              label="Phòng học"
              name="id_room"
              value={formData.id_room}
              onChange={onChange}
            >
              <option value="">Chưa gán phòng</option>

              {rooms.map((room) => (
                <option key={room.id_room} value={room.id_room}>
                  {room.room_code} - {room.room_name || "Không tên"}
                  {room.building ? ` - ${room.building}` : ""}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Trạng thái"
              name="status"
              value={formData.status}
              onChange={onChange}
            >
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </FormSelect>

            <div className="md:col-span-2">
              <Input
                label="Vị trí lắp đặt"
                name="location"
                value={formData.location}
                onChange={onChange}
                placeholder="Ví dụ: Trước cửa phòng A101"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-white transition disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  saving ? "animate-spin" : ""
                }`}
              >
                {saving ? "progress_activity" : "save"}
              </span>

              {saving
                ? "Đang lưu..."
                : mode === "add"
                ? "Thêm camera"
                : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value = "",
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
        >
          {children}
        </select>

        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}