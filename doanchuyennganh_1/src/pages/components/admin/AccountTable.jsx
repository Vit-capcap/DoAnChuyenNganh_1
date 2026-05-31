export default function AccountTable({
  accounts,
  loading,
  pagination,
  page,
  setPage,
  roleLabels,
  roleClass,
  formatDateTime,
  getInitials,
  getAvatar,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-white">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Danh sách tài khoản
          </h3>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Quản lý tài khoản đăng nhập, vai trò và trạng thái người dùng.
          </p>
        </div>

        <span className="text-sm font-bold text-slate-500">
          Tổng số: {pagination.total || 0} tài khoản
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <TableHead>Người dùng</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đăng nhập cuối</TableHead>
              <TableHead right>Thao tác</TableHead>
            </tr>
          </thead>

          <tbody className="text-sm text-slate-900 divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                >
                  Đang tải danh sách tài khoản...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <span className="material-symbols-outlined text-3xl">
                        manage_accounts
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      Không có tài khoản nào
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Hãy thử đổi bộ lọc hoặc thêm tài khoản mới.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const isLocked = account.status === "LOCKED";

                return (
                  <tr
                    key={account.id_account}
                    className="hover:bg-blue-50/40 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {account.display_avatar ? (
                          <img
                            src={getAvatar(account)}
                            alt={account.display_name || account.username}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-black text-blue-700 shadow-sm">
                            {getInitials(
                              account.display_name || account.username
                            )}
                          </div>
                        )}

                        <div>
                          <div className="font-black text-slate-900">
                            {account.display_name || account.username}
                          </div>

                          <div className="text-slate-500 text-xs font-semibold">
                            {account.display_email ||
                              account.user_code ||
                              "Admin"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {account.username}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                          roleClass[account.role] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {roleLabels[account.role] || account.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                          isLocked
                            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                            : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLocked ? "bg-rose-600" : "bg-emerald-600"
                          }`}
                        />
                        {isLocked ? "Bị khóa" : "Hoạt động"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {formatDateTime(account.last_login)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(account)}
                          className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleStatus(account)}
                          className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition ${
                            isLocked
                              ? "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                              : "border-red-100 text-red-500 hover:bg-red-50"
                          }`}
                          title={isLocked ? "Mở khóa" : "Khóa tài khoản"}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isLocked ? "lock_open" : "lock"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(account)}
                          className="w-10 h-10 flex items-center justify-center rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition"
                          title="Xóa tài khoản"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <span className="text-sm font-semibold text-slate-500">
          Hiển thị {accounts.length} trong tổng số {pagination.total || 0}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>

          <span className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-bold">
            {page} / {pagination.totalPages || 1}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))
            }
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th
      className={`px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wide whitespace-nowrap ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}