export default function RoomModal({
  mode,
  formData,
  onChange,
  onClose,
  onSubmit,
}) {
  const title = mode === "add" ? "Thêm phòng học" : "Cập nhật phòng học";
  const description =
    mode === "add"
      ? "Nhập thông tin phòng học và camera điểm danh."
      : "Chỉnh sửa thông tin phòng học và trạng thái camera.";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-black">{title}</h3>

              <p className="text-sm text-blue-100 mt-1">{description}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Mã phòng học"
              name="room_code"
              value={formData.room_code}
              onChange={onChange}
              placeholder="VD: P101"
              required
            />

            <InputField
              label="Tên phòng học"
              name="room_name"
              value={formData.room_name}
              onChange={onChange}
              placeholder="VD: Phòng thực hành AI"
              required
            />

            <InputField
              label="Tòa nhà"
              name="building"
              value={formData.building}
              onChange={onChange}
              placeholder="VD: Khu A"
              required
            />

            <InputField
              label="Tầng"
              name="floor"
              value={formData.floor}
              onChange={onChange}
              placeholder="VD: 2"
            />

            <InputField
              label="Sức chứa"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={onChange}
              placeholder="VD: 60"
              required
            />

            <SelectField
              label="Trạng thái phòng"
              name="room_status"
              value={formData.room_status}
              onChange={onChange}
              options={[
                { value: "ACTIVE", label: "Đang sử dụng" },
                { value: "MAINTENANCE", label: "Bảo trì" },
              ]}
            />

            <InputField
              label="Tên camera"
              name="camera_name"
              value={formData.camera_name}
              onChange={onChange}
              placeholder="VD: Camera cửa chính"
            />

            <InputField
              label="IP camera"
              name="camera_ip"
              value={formData.camera_ip}
              onChange={onChange}
              placeholder="VD: 192.168.1.20"
            />

            <InputField
              label="Vị trí camera"
              name="camera_location"
              value={formData.camera_location}
              onChange={onChange}
              placeholder="VD: Góc trái phòng"
            />

            <SelectField
              label="Trạng thái camera"
              name="camera_status"
              value={formData.camera_status}
              onChange={onChange}
              options={[
                { value: "ONLINE", label: "Online" },
                { value: "OFFLINE", label: "Offline" },
              ]}
            />
          </div>

          <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-white transition"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              {mode === "add" ? "Thêm phòng học" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="material-symbols-outlined absolute right-4 bottom-3 text-slate-400 pointer-events-none">
        expand_more
      </span>
    </div>
  );
}