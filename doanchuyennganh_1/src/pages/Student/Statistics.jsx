// import StatCard from "../components/StatCard";
import SidebarItem from "../components/SidebarItem";


export default function Statistics() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 w-[280px] h-screen bg-[#111827] text-white hidden md:flex flex-col z-50">

        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuByqpuGT4ZURM80QuN_t5H06SiXoGLOTzxdIng8RWquPlW9UpfcpjnGm8am9toduK4jb-5FdUal4_Gm0-_J6R15bETCjB-Tqcx1YO14Kj5C3bDqT3lY-6TR0zPafo_lmTPqJnwJwvGtujsfZp6A6iC-9EQkJ3r0ynJUV0absqZVAzEWYsYikklO_Tgs2lqui1VY25TItD_04fhkYTTVovOtrZNFZhpzt-0RQ4d3CCp9ABBi6jWXZSYjPmXKAe7MGuvaZIgsNG69Og"
              alt=""
              className="w-12 h-12 rounded-full"
            />

            <div>
              <h1 className="text-2xl font-bold">
                EduFace AI
              </h1>

              <p className="text-sm text-gray-400">
                Biometric System
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 p-4 space-y-2">

          <SidebarItem icon="dashboard" title="Dashboard" />

          <SidebarItem icon="face" title="Face Registration" />

          <SidebarItem icon="calendar_month" title="Study Schedule" />

          <SidebarItem icon="history" title="Attendance History" />

          <SidebarItem icon="leaderboard" title="Statistics" active />

          <SidebarItem icon="notifications" title="Notifications" />

          <SidebarItem icon="settings" title="Settings" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full bg-white/10 hover:bg-white/20 transition rounded-xl py-3 mb-3">
            Help Support
          </button>

          <button className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-xl py-3 transition">
            <span className="material-symbols-outlined">
              logout
            </span>

            Logout
          </button>
        </div>
      </aside>

      {/* HEADER */}
      <header className="fixed top-0 right-0 md:left-[280px] h-[80px] bg-white/80 backdrop-blur-lg border-b border-gray-200 flex items-center justify-between px-6 z-40">

        <div>
          <h2 className="text-3xl font-bold text-blue-700">
            Student Portal
          </h2>
        </div>

        <div className="flex items-center gap-4">

          {/* Search */}
          <div className="hidden md:flex items-center bg-blue-100 rounded-full px-6 py-2 border border-transparent focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 transition">
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none"
            />

            <span className="material-symbols-outlined text-gray-500 ">
              search
            </span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined">
              notifications
            </span>

            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Avatar */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAycJ0tEqeG-1uLDOlXlgjI1dU8HkpVebjSbkLUez0eXu8DDxLTNlOyo_8XD0-uo1--Y-xN63S2rEmTS0HOQhWOX9niSdgdaddNuBfFYlkPk1tSW-VQRU4yDZ81GUgDnSzbM9qu--rvEmZM_A0QeG2xJnRXJ1rOWF-awF6gecutUqgPdLf44gwdQMqctU7p5C-yeX0yVDx78tunxeT2A1OA3aYXDL5pKXfSZRKpr7jUGd0zmoPaB7wDMpiMokDZ6-IMALT8mFmfSA"
            alt=""
            className="w-11 h-11 rounded-full border"
          />
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 md:ml-[280px] flex flex-col">

        

        {/* Content */}
        <main className="mt-[80px] p-6">

          <h2 className="text-3xl font-bold mb-2">Attendance Analytics</h2>
          <p className="text-gray-500 mb-6">
            Biometric attendance records and trends
          </p>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">

            <div className="p-5 bg-white rounded-xl shadow">
              <h3 className="font-bold">Improving</h3>
              <p className="text-gray-500">Software Engineering</p>
              <p className="text-blue-600 text-2xl font-bold">+15%</p>
            </div>

            <div className="p-5 bg-white rounded-xl shadow">
              <h3 className="font-bold">Needs Attention</h3>
              <p className="text-gray-500">Calculus III</p>
              <p className="text-red-500 text-2xl font-bold">-8%</p>
            </div>

            <div className="p-5 bg-blue-600 text-white rounded-xl shadow">
              <h3>Total Biometric Scans</h3>
              <p className="text-4xl font-bold">142</p>
            </div>

          </div>

          {/* Attendance */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Pie */}
            <div className="bg-white p-5 rounded-xl shadow">
              <h3 className="font-bold mb-4">Overall Breakdown</h3>

              <div className="w-40 h-40 mx-auto rounded-full"
                style={{
                  background: "conic-gradient(#2563eb 0% 75%, #e5e7eb 75% 85%, #ef4444 85% 100%)"
                }}
              />

              <p className="text-center mt-3 font-bold">75% Present</p>
            </div>

            {/* Bars */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow">
              <h3 className="font-bold mb-4">Subject Attendance</h3>

              {[
                ["Software Engineering", 92],
                ["Database", 85],
                ["Machine Learning", 78],
                ["Calculus III", 65],
                ["Literature", 95],
              ].map(([name, val], i) => (
                <div key={i} className="mb-3">
                  <div className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span>{val}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}