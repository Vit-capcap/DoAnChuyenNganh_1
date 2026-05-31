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

const profileData = {
  name: "Alexander Bennett",
  fullName: "Alexander James Bennett",
  studentId: "CS-2023-8942",
  major: "Computer Science",
  classYear: "Class of '25",
  dob: "October 14, 2002",
  email: "a.bennett@university.edu",
  phone: "+1 (555) 019-2837",
  enrollmentDate: "September 1, 2021",
  emergencyName: "Sarah Bennett (Mother)",
  emergencyPhone: "+1 (555) 019-9922",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDiEIDa_Z4PKUiXDad0FvdFkxI4bN3xGGBG89GDYsNYRuTkUCVPHcnEt9PHYVHldVa8-lDZ_ymK1jiLEkhy2vnI7X_WHac0zoHoyj-Gqx8CmMXj2F17RaD0talT2qngimBhepCUri7v9DMFvh5GoruyZZq7RLsGDW1yN1BJAYWD66qHI1HDbdjfWJ1x-5cr_61lhqXerN7e0JvP0B07nYHcEzHFzGqEOAFKuzPWPf153lC77QSX1MRjTWm_Spv6E-klnGl5EnL65A",
};

const personalInfo = [
  {
    label: "Full Legal Name",
    value: profileData.fullName,
  },
  {
    label: "Date of Birth",
    value: profileData.dob,
  },
  {
    label: "University Email",
    value: profileData.email,
    icon: "mail",
  },
  {
    label: "Phone Number",
    value: profileData.phone,
    icon: "smartphone",
  },
  {
    label: "Enrollment Date",
    value: profileData.enrollmentDate,
  },
  {
    label: "Emergency Contact",
    value: profileData.emergencyName,
    subValue: profileData.emergencyPhone,
  },
];

function InfoField({ label, value, subValue, icon }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition">
      <p className="text-sm text-gray-500 mb-2">{label}</p>

      <div className="flex items-start gap-3">
        {icon && (
          <span className="material-symbols-outlined text-blue-600 mt-0.5">
            {icon}
          </span>
        )}

        <div>
          <p className="text-gray-800 font-medium">{value}</p>

          {subValue && (
            <p className="text-sm text-gray-500 mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-700">
              {icon}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-800">
            {title}
          </h3>
        </div>

        {action}
      </div>

      {/* CONTENT */}
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function PersonalProfilePage() {
  return (
    <div className="min-h-screen bg-[#f3f6fb] text-gray-800 overflow-x-hidden">

      {/* =========================
            SCROLLBAR
      ========================= */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

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

      {/* =========================
              HEADER
      ========================= */}
      <header className="fixed top-0 right-0 md:left-[280px] h-[80px] bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-6 z-40">

        {/* TITLE */}
        <div>
          <h2 className="text-3xl font-extrabold text-blue-700">
            Student Portal
          </h2>

          <p className="text-sm text-gray-500">
            Personal Profile Management
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          {/* SEARCH */}
          <div className="hidden lg:flex items-center bg-[#f3f6fb] rounded-full px-5 py-2.5 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition">

            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-[220px]"
            />

            <span className="material-symbols-outlined text-gray-500">
              search
            </span>
          </div>

          {/* NOTIFICATION */}
          <button className="relative w-11 h-11 rounded-2xl bg-[#f3f6fb] hover:bg-gray-200 transition flex items-center justify-center">

            <span className="material-symbols-outlined text-gray-700">
              notifications
            </span>

            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>

          {/* AVATAR */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAycJ0tEqeG-1uLDOlXlgjI1dU8HkpVebjSbkLUez0eXu8DDxLTNlOyo_8XD0-uo1--Y-xN63S2rEmTS0HOQhWOX9niSdgdaddNuBfFYlkPk1tSW-VQRU4yDZ81GUgDnSzbM9qu--rvEmZM_A0QeG2xJnRXJ1rOWF-awF6gecutUqgPdLf44gwdQMqctU7p5C-yeX0yVDx78tunxeT2A1OA3aYXDL5pKXfSZRKpr7jUGd0zmoPaB7wDMpiMokDZ6-IMALT8mFmfSA"
            alt="avatar"
            className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover"
          />
        </div>
      </header>

      {/* =========================
                MAIN
      ========================= */}
      <main className="md:ml-[280px] pt-[110px] px-6 pb-8">

        <div className="max-w-[1500px] mx-auto">

          {/* PAGE HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">

            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
                Personal Profile
              </h1>

              <p className="text-gray-500">
                Manage your biometric identity and academic records.
              </p>
            </div>

            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-blue-200 transition flex items-center gap-2">

              <span className="material-symbols-outlined text-[20px]">
                edit
              </span>

              Edit Profile
            </button>
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT */}
            <div className="xl:col-span-4">

              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">

                {/* BANNER */}
                <div className="h-[160px] bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* PROFILE */}
                <div className="px-6 pb-6 relative flex flex-col items-center text-center -mt-[70px]">

                  {/* AVATAR */}
                  <div className="relative mb-5">

                    <div className="w-[130px] h-[130px] rounded-full overflow-hidden border-[6px] border-white shadow-xl bg-white">

                      <img
                        src={profileData.avatar}
                        alt="profile"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <button className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center shadow-lg transition">

                      <span className="material-symbols-outlined text-[18px]">
                        photo_camera
                      </span>
                    </button>
                  </div>

                  {/* INFO */}
                  <h2 className="text-2xl font-bold text-gray-800">
                    {profileData.name}
                  </h2>

                  <p className="text-blue-700 tracking-widest text-sm font-semibold mt-1 mb-5">
                    ID: {profileData.studentId}
                  </p>

                  {/* TAGS */}
                  <div className="flex flex-wrap justify-center gap-3 mb-6">

                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                      {profileData.major}
                    </span>

                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium">
                      {profileData.classYear}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <span className="material-symbols-outlined text-blue-700">
                        face
                      </span>

                      <span className="font-medium text-gray-700">
                        Face ID Status
                      </span>
                    </div>

                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">

                      <span className="material-symbols-outlined text-[16px]">
                        check_circle
                      </span>

                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="xl:col-span-8 flex flex-col gap-6">

              {/* PERSONAL INFO */}
              <SectionCard
                title="Personal Information"
                icon="badge"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {personalInfo.map((item, index) => (
                    <InfoField
                      key={index}
                      label={item.label}
                      value={item.value}
                      subValue={item.subValue}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </SectionCard>

              {/* SECURITY */}
              <SectionCard
                title="Account Security"
                icon="security"
                action={
                  <button className="border border-gray-300 hover:border-blue-500 hover:text-blue-700 px-5 py-2 rounded-xl transition font-medium">
                    Update Security
                  </button>
                }
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">
                      Password & Authentication
                    </p>

                    <p className="text-gray-500">
                      Last changed 45 days ago. Two-factor authentication is
                      currently enabled.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-medium w-fit">

                    <span className="material-symbols-outlined">
                      verified_user
                    </span>

                    Protected
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}