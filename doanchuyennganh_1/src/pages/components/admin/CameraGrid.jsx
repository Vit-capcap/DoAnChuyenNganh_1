export default function CameraGrid({
  cameras,
  loading,
  getRoomLabel,
  getCameraPlaceholder,
  safePercent,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

        <p className="text-sm font-semibold text-slate-600">
          Đang tải danh sách camera...
        </p>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-slate-400 text-3xl">
            videocam_off
          </span>
        </div>

        <h3 className="font-black text-slate-900">Không có camera nào</h3>

        <p className="text-sm text-slate-500 mt-2">
          Hãy thêm camera mới hoặc kiểm tra lại bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {cameras.map((camera) => {
        const online = camera.status === "ONLINE";

        return (
          <div
            key={camera.id_camera}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              className={`relative aspect-video overflow-hidden ${
                online ? "bg-slate-950" : "bg-slate-100"
              }`}
            >
              {online ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{
                      backgroundImage: `url(${getCameraPlaceholder(camera)})`,
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/60" />

                  {Number(camera.today_recognition_count || 0) > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className="absolute border-2 border-cyan-400/80 bg-cyan-400/10"
                        style={{
                          top: "28%",
                          left: "38%",
                          width: "18%",
                          height: "28%",
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-cyan-400 text-black text-[10px] px-1 font-bold">
                          AI FACE
                        </div>
                      </div>

                      <div
                        className="absolute border-2 border-cyan-400/80 bg-cyan-400/10"
                        style={{
                          top: "42%",
                          left: "60%",
                          width: "12%",
                          height: "20%",
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <span className="material-symbols-outlined text-[54px] mb-2">
                      videocam_off
                    </span>

                    <p className="text-sm font-bold text-rose-500">
                      Signal Lost
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-white">
                    {camera.camera_name || "Camera không tên"}
                  </h3>

                  <p className="text-[11px] text-slate-300 mt-1">
                    IP: {camera.camera_ip || "-"} • {getRoomLabel(camera)}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    online
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      online ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                  {online ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    Nhận diện hôm nay
                  </p>

                  <p className="text-sm font-black text-slate-900 mt-1">
                    {camera.today_recognition_count || 0} lượt • Avg{" "}
                    {safePercent(camera.avg_confidence)}%
                  </p>
                </div>

                <div className="flex gap-2">
                  <IconButton title="Sửa camera" onClick={() => onEdit(camera)}>
                    edit
                  </IconButton>

                  <IconButton
                    title={online ? "Tắt camera" : "Bật camera"}
                    onClick={() => onToggleStatus(camera)}
                    className={
                      online
                        ? "border-red-100 text-red-500 hover:bg-red-50"
                        : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                    }
                  >
                    {online ? "videocam_off" : "videocam"}
                  </IconButton>

                  <IconButton
                    title="Xóa camera"
                    onClick={() => onDelete(camera)}
                    className="border-red-100 text-red-500 hover:bg-red-50"
                  >
                    delete
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
  className = "border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">{children}</span>
    </button>
  );
}