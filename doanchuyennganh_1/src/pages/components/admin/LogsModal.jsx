export default function LogsModal({ logs, formatDateTime, onClose }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative z-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-start gap-4">
          <div>
            <h3 className="text-xl font-black">Lịch sử cài đặt hệ thống</h3>
            <p className="text-sm text-blue-100 mt-1">
              Theo dõi các thao tác thay đổi cấu hình và backup.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {logs.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-4xl">
                history
              </span>

              <p className="text-sm font-bold text-slate-600 mt-3">
                Chưa có lịch sử thao tác.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((item) => (
                <div
                  key={item.id_log}
                  className="border border-slate-200 rounded-2xl p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-black text-slate-900">
                      {item.action}
                    </p>

                    <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 mt-2">
                    {item.device || item.description || "Không có mô tả"}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    IP: {item.ip_address || "Không xác định"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}