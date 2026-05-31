export default function RoomModal({
  mode,
  formData,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "add" ? "Thêm phòng học" : "Chỉnh sửa phòng học"}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Nhập thông tin phòng học và thiết bị camera.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <Section title="Thông tin phòng học" icon="meeting_room">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Mã phòng *"
                name="room_code"
                value={formData.room_code}
                onChange={onChange}
                placeholder="Ví dụ: P302"
              />

              <Input
                label="Tên phòng *"
                name="room_name"
                value={formData.room_name}
                onChange={onChange}
                placeholder="Ví dụ: Phòng 302"
              />

              <Input
                label="Tòa nhà *"
                name="building"
                value={formData.building}
                onChange={onChange}
                placeholder="Ví dụ: Tòa A2"
              />

              <Input
                label="Tầng"
                name="floor"
                value={formData.floor}
                onChange={onChange}
                placeholder="Ví dụ: 3"
              />

              <Input
                label="Sức chứa *"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={onChange}
                placeholder="Ví dụ: 60"
              />

              <Input
                label="Camera IP của phòng"
                name="camera_ip"
                value={formData.camera_ip}
                onChange={onChange}
                placeholder="Ví dụ: 192.168.1.100"
              />

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Trạng thái phòng
                </label>

                <select
                  name="room_status"
                  value={formData.room_status}
                  onChange={onChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ACTIVE">Đang sử dụng</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Thiết bị camera" icon="videocam">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Tên camera"
                name="camera_name"
                value={formData.camera_name}
                onChange={onChange}
                placeholder="Ví dụ: Camera P302"
              />

              <Input
                label="Vị trí camera"
                name="camera_location"
                value={formData.camera_location}
                onChange={onChange}
                placeholder="Ví dụ: Tòa A2 - Phòng 302"
              />

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Trạng thái camera
                </label>

                <select
                  name="camera_status"
                  value={formData.camera_status}
                  onChange={onChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>
          </Section>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              {mode === "add" ? "Thêm phòng" : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-xl">
          {icon}
        </span>

        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      </div>

      {children}
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder = "",
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1 block">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      />
    </div>
  );
}