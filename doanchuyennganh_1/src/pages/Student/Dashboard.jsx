// src/pages/Student/Dashboard.jsx

import StatCard from "../components/StatCard";
import SidebarItem from "../components/SidebarItem";
import Bar from "../components/Bar";
import ClassItem from "../components/ClassItem";
import QuickButton from "../components/QuickButton";
import TableRow from "../components/TableRow";

export default function Dashboard() {
  return (
    <div className="bg-slate-50 min-h-screen font-[Inter] text-gray-800">
      
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

          <SidebarItem icon="dashboard" title="Dashboard" active />

          <SidebarItem icon="face" title="Face Registration" />

          <SidebarItem icon="calendar_month" title="Study Schedule" />

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

      {/* MAIN */}
      <main className="pt-[100px] md:ml-[280px] p-6">

        {/* Welcome */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">

          <div>
            <h1 className="text-4xl font-bold">
              Welcome back, Alex.
            </h1>

            <p className="text-gray-500 mt-2">
              Here's your attendance overview for this semester.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-gray-200 px-5 py-3 rounded-full shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>

            <span className="font-semibold">
              AI Face Recognition:
              <span className="text-green-600 ml-1">
                Active
              </span>
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

          {/* Attendance Circle */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center">

            <div className="relative w-36 h-36">

              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3.5"
                />

                <path
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeDasharray="92, 100"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">
                  92%
                </span>
              </div>
            </div>

            <p className="mt-4 text-green-600 font-medium">
              +2% from last week
            </p>
          </div>

          <StatCard
            icon="check_circle"
            value="48"
            label="Present"
            color="green"
          />

          <StatCard
            icon="cancel"
            value="3"
            label="Absent"
            color="red"
          />

          <StatCard
            icon="schedule"
            value="1"
            label="Late"
            color="yellow"
          />
        </div>

        {/* CHART + ACTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-2">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Weekly Attendance Trends
              </h2>

              <button className="text-blue-600 font-semibold">
                This Week
              </button>
            </div>

            <div className="h-[300px] flex items-end justify-around gap-4">

              <Bar value="80%" day="Mon" />

              <Bar value="95%" day="Tue" />

              <Bar value="60%" day="Wed" />

              <Bar value="100%" day="Thu" />

              <Bar value="85%" day="Fri" />
            </div>
          </div>

          {/* Quick Action */}
          <div className="space-y-6">

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">

              <h2 className="text-2xl font-bold mb-5">
                Quick Actions
              </h2>

              <div className="space-y-3">

                <QuickButton
                  icon="face_retouching_natural"
                  title="Register Face"
                  primary
                />

                <QuickButton
                  icon="calendar_month"
                  title="View Schedule"
                />

                <QuickButton
                  icon="download"
                  title="Download Report"
                />
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">

              <h2 className="text-2xl font-bold mb-5">
                Upcoming Classes
              </h2>

              <div className="space-y-4">

                <ClassItem
                  time="10:00"
                  subject="Advanced AI Ethics"
                  room="Room 402"
                />

                <ClassItem
                  time="01:30"
                  subject="Data Structures"
                  room="Lab 3"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Recent Attendance History
            </h2>

            <button className="text-blue-600 font-semibold">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr className="text-left">
                  <th className="p-4">Subject</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Confidence</th>
                </tr>
              </thead>

              <tbody>

                <TableRow
                  subject="Software Engineering"
                  date="Oct 24, 2023"
                  status="Present"
                  percent="98%"
                />

                <TableRow
                  subject="Calculus II"
                  date="Oct 23, 2023"
                  status="Present"
                  percent="95%"
                />

                <TableRow
                  subject="Literature"
                  date="Oct 21, 2023"
                  status="Late"
                  percent="88%"
                />
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
