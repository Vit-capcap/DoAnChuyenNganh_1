import { useNavigate } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="md:hidden">
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            FaceID Admin
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Management System
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Welcome back
          </p>
          <h2 className="text-lg font-black text-slate-900">
            Quản trị hệ thống
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
          title="Thông báo"
        >
          <span className="material-symbols-outlined text-[22px]">
            notifications
          </span>

          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        </button>

        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 sm:flex"
          title="Chế độ tối"
        >
          <span className="material-symbols-outlined text-[22px]">
            dark_mode
          </span>
        </button>

        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 sm:flex"
          title="Cài đặt"
          onClick={() => navigate("/settings")}
        >
          <span className="material-symbols-outlined text-[22px]">
            settings
          </span>
        </button>

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          className="flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition hover:bg-slate-100"
        >
          <img
            alt="Admin"
            className="h-9 w-9 rounded-2xl border border-slate-200 object-cover shadow-sm"
            src="https://i.pravatar.cc/150?img=12"
          />

          <div className="hidden text-left lg:block">
            <p className="text-sm font-black leading-4 text-slate-900">
              Admin
            </p>
            <p className="text-xs font-semibold text-slate-400">
              System Manager
            </p>
          </div>

          <span className="material-symbols-outlined hidden text-[20px] text-slate-400 lg:block">
            expand_more
          </span>
        </button>
      </div>
    </header>
  );
}