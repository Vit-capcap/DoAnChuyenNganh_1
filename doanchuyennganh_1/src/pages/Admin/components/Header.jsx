export default function Header() {
  return (
    <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 bg-[#faf8ff] border-b border-gray-300 shadow-sm">
      <div className="md:hidden flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-xl font-bold text-blue-700">FaceID Admin</span>
      </div>

      <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-96">
        <span className="material-symbols-outlined text-gray-500 mr-2">
          search
        </span>
        <input
          className="bg-transparent border-none outline-none w-full focus:ring-0"
          placeholder="Tìm kiếm..."
          type="text"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100">
          <span className="material-symbols-outlined">dark_mode</span>
        </button>

        <button className="p-2 rounded-full hover:bg-gray-100">
          <span className="material-symbols-outlined">settings</span>
        </button>

        <img
          alt="Admin"
          className="w-8 h-8 rounded-full ml-2 border cursor-pointer"
          src="https://i.pravatar.cc/150?img=12"
        />
      </div>
    </header>
  );
}