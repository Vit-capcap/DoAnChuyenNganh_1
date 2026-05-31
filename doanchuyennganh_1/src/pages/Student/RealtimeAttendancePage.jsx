import SidebarItem from "../components/SidebarItem";

const sidebarItems = [
    { icon: "dashboard", title: "Dashboard" },
    { icon: "face", title: "Face Registration" },
    { icon: "calendar_month", title: "Study Schedule" },
    { icon: "history", title: "Attendance History" },
    { icon: "leaderboard", title: "Statistics" },
    { icon: "notifications", title: "Notifications" },
    { icon: "settings", title: "Settings", active: true },
  ];

export default function RealtimeAttendancePage() {
    return (
      <div className="bg-background text-on-background min-h-screen font-sans overflow-x-hidden">
      {/* =========================
              SIDEBAR
      ========================= */}
      <aside className="fixed left-0 top-0 w-[280px] h-screen bg-[#111827] text-white hidden md:flex flex-col z-50 shadow-2xl">

        {/* LOGO */}
        <div className="p-6 border-b border-white/10">

          <div className="flex items-center gap-4">

            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuByqpuGT4ZURM80QuN_t5H06SiXoGLOTzxdIng8RWquPlW9UpfcpjnGm8am9toduK4jb-5FdUal4_Gm0-_J6R15bETCjB-Tqcx1YO14Kj5C3bDqT3lY-6TR0zPafo_lmTPqJnwJwvGtujsfZp6A6iC-9EQkJ3r0ynJUV0absqZVAzEWYsYikklO_Tgs2lqui1VY25TItD_04fhkYTTVovOtrZNFZhpzt-0RQ4d3CCp9ABBi6jWXZSYjPmXKAe7MGuvaZIgsNG69Og"
              alt="logo"
              className="w-12 h-12 rounded-full object-cover"
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

        {/* MENU */}
        <div className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">

          {sidebarItems.map((item, index) => (
            <SidebarItem
              key={index}
              icon={item.icon}
              title={item.title}
              active={item.active}
            />
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">

          <button className="w-full bg-white/10 hover:bg-white/20 transition rounded-2xl py-3 mb-3">
            Help Support
          </button>

          <button className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-2xl py-3 transition">

            <span className="material-symbols-outlined">
              logout
            </span>

            Logout
          </button>
        </div>
      </aside>

  
        {/* Main Content */}
        <main className="md:ml-[280px] min-h-screen">
          {/* Topbar */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-outline-variant/20">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h2 className="text-3xl font-black text-on-background">
                  Realtime Attendance
                </h2>
  
                <p className="text-sm text-on-surface-variant mt-1">
                  AI-powered biometric classroom monitoring
                </p>
              </div>
  
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden lg:flex items-center bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/30 w-[320px]">
                  <span className="material-symbols-outlined text-on-surface-variant mr-2">
                    search
                  </span>
  
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="bg-transparent outline-none w-full text-sm"
                  />
                </div>
  
                {/* Notification */}
                <button className="relative p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container transition">
                  <span className="material-symbols-outlined">
                    notifications
                  </span>
  
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
                </button>
  
                {/* Avatar */}
                <img
                  src="https://i.pravatar.cc/150?img=12"
                  alt="avatar"
                  className="w-12 h-12 rounded-2xl object-cover border border-outline-variant/30"
                />
              </div>
            </div>
          </header>
  
          {/* Body */}
          <div className="p-6">
            {/* Header Info */}
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    location_on
                  </span>
  
                  <h3 className="text-2xl font-bold">
                    Room 402 - Advanced AI
                  </h3>
                </div>
  
                <p className="text-on-surface-variant">
                  Prof. Alan Turing | CS-401 | 10:00 AM - 11:30 AM
                </p>
              </div>
  
              <div className="flex items-center gap-3 bg-surface-container-low rounded-full px-5 py-3 border border-outline-variant/30">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
  
                <span className="font-semibold">Camera Active</span>
  
                <span className="material-symbols-outlined text-on-surface-variant">
                  videocam
                </span>
              </div>
            </div>
  
            {/* Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Camera Feed */}
              <div className="xl:col-span-2 overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg">
                {/* Top */}
                <div className="flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur text-white">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-400">
                      memory
                    </span>
  
                    <span className="uppercase tracking-widest text-sm font-bold text-sky-400">
                      Bio Scan Active
                    </span>
                  </div>
  
                  <span className="text-sm text-white/70">
                    Feed: CAM-04-NORTH
                  </span>
                </div>
  
                {/* Camera */}
                <div className="relative h-[520px] overflow-hidden bg-black">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
                    alt=""
                    className="w-full h-full object-cover opacity-50"
                  />
  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20"></div>
  
                  {/* Scan box */}
                  <div className="absolute top-[28%] left-[42%] w-32 h-40 border-2 border-sky-400 rounded-md shadow-[0_0_20px_rgba(56,189,248,0.7)]">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-3 py-1 rounded-xl text-white text-xs whitespace-nowrap border border-sky-400/30">
                      Emma Carter (98%)
                    </div>
                  </div>
  
                  {/* Scan line */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-sky-400 shadow-[0_0_20px_#38BDF8] animate-pulse"></div>
                </div>
  
                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-outline-variant/20 bg-surface">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-primary animate-ping"></span>
  
                    <span className="text-sm text-on-surface-variant">
                      Processing 24 faces/sec
                    </span>
                  </div>
  
                  <span className="text-sm text-outline">
                    Engine: Tensor-V4
                  </span>
                </div>
              </div>
  
              {/* Right Side */}
              <div className="space-y-6">
                {/* Progress */}
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-lg">
                  <h4 className="uppercase tracking-widest text-sm text-on-surface-variant mb-4">
                    Session Progress
                  </h4>
  
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-6xl font-black text-primary">
                      42
                    </span>
  
                    <span className="text-on-surface-variant mb-2">
                      / 50 Present
                    </span>
                  </div>
  
                  <div className="h-3 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full w-[84%] bg-primary rounded-full"></div>
                  </div>
  
                  <div className="flex justify-between mt-3 text-sm text-outline">
                    <span>84% Attendance Rate</span>
                    <span>8 Missing</span>
                  </div>
                </div>
  
                {/* Detection List */}
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                    <h4 className="font-bold">Recent Detections</h4>
  
                    <button className="text-primary text-sm hover:underline">
                      View All
                    </button>
                  </div>
  
                  <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                    {[
                      ["Emma Carter", "98%", "Just now"],
                      ["Liam Johnson", "95%", "2 mins ago"],
                      ["Aisha Patel", "Late", "15 mins ago"],
                    ].map(([name, status, time], index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low transition"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?img=${index + 10}`}
                          alt=""
                          className="w-12 h-12 rounded-2xl object-cover"
                        />
  
                        <div className="flex-1">
                          <p className="font-semibold">{name}</p>
  
                          <p className="text-xs text-outline">
                            CS-2024-0{index + 89}
                          </p>
                        </div>
  
                        <div className="text-right">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-bold">
                            {status}
                          </span>
  
                          <p className="text-xs text-outline mt-1">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
  
            {/* Missing */}
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-5">
                Awaiting Arrival (8)
              </h3>
  
              <div className="flex gap-4 overflow-x-auto pb-2">
                {["S. Davis", "M. Chen", "J. Smith", "L. Brown"].map(
                  (student, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-2 py-2 min-w-fit opacity-70"
                    >
                      <img
                        src={`https://i.pravatar.cc/100?img=${index + 30}`}
                        alt=""
                        className="w-10 h-10 rounded-full grayscale"
                      />
  
                      <span className="pr-3 text-sm">{student}</span>
                    </div>
                  )
                )}
  
                <button className="rounded-full border border-dashed border-outline-variant/40 px-5 text-on-surface-variant hover:bg-surface-container-low transition">
                  +5 More
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }