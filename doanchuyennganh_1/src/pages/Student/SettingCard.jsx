// src/pages/Student/SettingCard.jsx
import StudentLayout from "./components/StudentLayout";

function SettingCard({ icon, title, children }) {
  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-700">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">{children}</div>
    </section>
  );
}

function SettingItem({ title, description, button, toggle, select }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-gray-100 last:border-none last:pb-0">
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {button}
      {toggle}
      {select}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Settings &amp; Preferences"
      showSearch={false}
    >
      <div className="max-w-[1500px] mx-auto">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-500">
            Manage your account, appearance, and biometric system preferences.
          </p>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* LEFT SIDEBAR */}
          <div className="xl:col-span-4 space-y-6">

            {/* SETTINGS MENU */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5">
              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 bg-blue-100 text-blue-700 px-4 py-3 rounded-2xl font-medium">
                  <span className="material-symbols-outlined">person</span>
                  Account
                </button>

                <button className="w-full flex items-center gap-3 hover:bg-gray-100 text-gray-600 hover:text-gray-800 px-4 py-3 rounded-2xl transition">
                  <span className="material-symbols-outlined">palette</span>
                  Appearance
                </button>

                <button className="w-full flex items-center gap-3 hover:bg-gray-100 text-gray-600 hover:text-gray-800 px-4 py-3 rounded-2xl transition">
                  <span className="material-symbols-outlined">memory</span>
                  System
                </button>
              </nav>
            </div>

            {/* AI STATUS */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white p-8 shadow-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-5 shadow-lg">
                  <span className="material-symbols-outlined text-[40px]">verified_user</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Biometrics</h3>
                <p className="text-white/80 mb-5">System is online and scanning actively.</p>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse"></span>
                  <span className="font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="xl:col-span-8 space-y-6">

            {/* ACCOUNT */}
            <SettingCard icon="person" title="Account Settings">
              <SettingItem
                title="Change Password"
                description="Update your account password regularly for security."
                button={
                  <button className="px-5 py-2.5 rounded-2xl border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium">
                    Update Password
                  </button>
                }
              />
              <SettingItem
                title="Email Preferences"
                description="Manage which academic emails you receive."
                button={
                  <button className="px-5 py-2.5 rounded-2xl border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium">
                    Manage Emails
                  </button>
                }
              />
            </SettingCard>

            {/* APPEARANCE */}
            <SettingCard icon="palette" title="Appearance">
              <SettingItem
                title="Dark Mode"
                description="Toggle high-contrast dark theme."
                toggle={
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-blue-700 after:content-[''] after:absolute after:left-[4px] after:top-[4px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                }
              />
              <SettingItem
                title="Language Selection"
                description="Choose your preferred portal language."
                select={
                  <select className="bg-[#f3f6fb] border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:border-blue-500">
                    <option>English (US)</option>
                    <option>Vietnamese</option>
                    <option>Japanese</option>
                  </select>
                }
              />
            </SettingCard>

            {/* SYSTEM */}
            <SettingCard icon="memory" title="System &amp; AI">
              <SettingItem
                title="Push Notifications"
                description="Receive alerts for attendance and schedule changes."
                toggle={
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-blue-700 after:content-[''] after:absolute after:left-[4px] after:top-[4px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5"></div>
                  </label>
                }
              />
              <SettingItem
                title="Face Recognition Sensitivity"
                description="Adjust AI confidence threshold for check-ins."
                select={
                  <select className="bg-[#f3f6fb] border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:border-blue-500">
                    <option>Low (Faster)</option>
                    <option>Medium (Balanced)</option>
                    <option>High (Strict)</option>
                  </select>
                }
              />
              <div className="pt-2">
                <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-blue-200 transition">
                  Save System Changes
                </button>
              </div>
            </SettingCard>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}