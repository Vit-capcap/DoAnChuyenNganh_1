import SidebarItem from "../components/SidebarItem";
import TodaySchedule from "../components/TodaySchedule";
import Calendar from "../components/Calendar";

export default function StudySchedule() {
  return (
    <div className="flex bg-[#F8FAFC] font-sans text-sm text-gray-800">

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

          <SidebarItem icon="calendar_month" title="Study Schedule" active />

          <SidebarItem icon="history" title="Attendance History"/>

          <SidebarItem icon="leaderboard" title="Statistics" />

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
      <main className="flex-1 md:ml-[280px] min-h-screen">

        {/* Content */}
        <div className="pt-24 p-5 space-y-6">

          {/* Title */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Study Schedule</h1>
              <p className="text-gray-500">
                Manage your classes and academic events
              </p>
            </div>
          </div>

          <div className="grid xl:grid-cols-4 gap-5">
          
            {/* Today */}
            <div>
              <TodaySchedule data={todayData} />
            </div>

            <div className="xl:col-span-3">
              <div>
                <Calendar />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
const todayData = [
    {
      title: "Advanced Machine Learning",
      time: "09:00 - 10:30",
      border: "border-blue-500",
    },
    {
      title: "Computer Vision Lab",
      time: "11:00 - 13:00",
      border: "border-purple-500",
    },
  ];

  