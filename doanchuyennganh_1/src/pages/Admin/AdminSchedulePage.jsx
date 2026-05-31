import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import ScheduleStats from "../components/admin/ScheduleStats";
import ScheduleFilters from "../components/admin/ScheduleFilters";
import ScheduleTable from "../components/admin/ScheduleTable";
import ScheduleCalendarView from "../components/admin/ScheduleCalendarView";
import ScheduleModal from "../components/admin/ScheduleModal";

import {
  getSchedules,
  getScheduleOptions,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../api/scheduleApi";

const initialForm = {
  id_schedule: "",
  id_course_class: "",
  id_room: "",
  day_of_week: "Monday",
  start_time: "",
  end_time: "",
  start_date: "",
  end_date: "",
};

const dayLabels = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

function formatDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function getTeacherAvatar(item) {
  if (item.teacher_avatar) return item.teacher_avatar;

  const name = encodeURIComponent(item.teacher_name || "Teacher");
  return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=ffffff`;
}

function isToday(dayOfWeek) {
  const now = new Date();
  const jsDay = now.getDay();

  const map = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  return map[dayOfWeek] === jsDay;
}

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState([]);

  const [courseClasses, setCourseClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [search, setSearch] = useState("");
  const [courseClassFilter, setCourseClassFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(initialForm);

  const [viewMode, setViewMode] = useState("table");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [scheduleData, optionData] = await Promise.all([
          getSchedules({
            search,
            id_course_class: courseClassFilter,
            id_teacher: teacherFilter,
            id_room: roomFilter,
            day_of_week: dayFilter,
          }),
          getScheduleOptions(),
        ]);

        if (!isMounted) return;

        setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
        setCourseClasses(
          Array.isArray(optionData.courseClasses)
            ? optionData.courseClasses
            : []
        );
        setRooms(Array.isArray(optionData.rooms) ? optionData.rooms : []);
        setTeachers(
          Array.isArray(optionData.teachers) ? optionData.teachers : []
        );
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải lịch học:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải lịch học");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadData();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    search,
    courseClassFilter,
    teacherFilter,
    roomFilter,
    dayFilter,
    refreshKey,
  ]);

  const groupedByDay = useMemo(() => {
    const groups = {};

    schedules.forEach((item) => {
      const day = item.day_of_week || "Unknown";

      if (!groups[day]) {
        groups[day] = [];
      }

      groups[day].push(item);
    });

    return groups;
  }, [schedules]);

  const stats = useMemo(() => {
    const todayCount = schedules.filter((item) =>
      isToday(item.day_of_week)
    ).length;

    return {
      total: schedules.length,
      today: todayCount,
      courseClasses: new Set(
        schedules.map((item) => item.id_course_class).filter(Boolean)
      ).size,
      rooms: new Set(schedules.map((item) => item.id_room).filter(Boolean))
        .size,
    };
  }, [schedules]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setShowModal(true);
    setMessage("");
  };

  const openEditModal = (item) => {
    setModalMode("edit");

    setFormData({
      id_schedule: item.id_schedule || "",
      id_course_class: item.id_course_class || "",
      id_room: item.id_room || "",
      day_of_week: item.day_of_week || "Monday",
      start_time: formatTime(item.start_time),
      end_time: formatTime(item.end_time),
      start_date: formatDateInput(item.start_date),
      end_date: formatDateInput(item.end_date),
    });

    setShowModal(true);
    setMessage("");
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.id_course_class) {
      setMessage("Vui lòng chọn lớp học phần");
      return false;
    }

    if (!formData.id_room) {
      setMessage("Vui lòng chọn phòng học");
      return false;
    }

    if (!formData.day_of_week) {
      setMessage("Vui lòng chọn thứ trong tuần");
      return false;
    }

    if (!formData.start_time || !formData.end_time) {
      setMessage("Vui lòng nhập giờ bắt đầu và giờ kết thúc");
      return false;
    }

    if (formData.start_time >= formData.end_time) {
      setMessage("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      id_course_class: Number(formData.id_course_class),
      id_room: Number(formData.id_room),
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      if (modalMode === "add") {
        await createSchedule(buildPayload());
        alert("Thêm lịch học thành công");
      } else {
        await updateSchedule(formData.id_schedule, buildPayload());
        alert("Cập nhật lịch học thành công");
      }

      closeModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu lịch học:", error);
      setMessage(error.message || "Lưu lịch học thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa lịch học ${item.class_code} - ${
        dayLabels[item.day_of_week]
      } không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteSchedule(item.id_schedule);

      alert("Xóa lịch học thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa lịch học:", error);
      setMessage(error.message || "Xóa lịch học thất bại");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCourseClassFilter("");
    setTeacherFilter("");
    setRoomFilter("");
    setDayFilter("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="schedule" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải lịch học...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="schedule" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_month
                  </span>
                  Quản trị lịch học
                </div>

                <h2 className="text-3xl font-bold tracking-tight">Lịch học</h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Quản lý lịch học, phòng học, giáo viên và thời gian giảng dạy
                  trong hệ thống điểm danh khuôn mặt.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === "table" ? "calendar" : "table"
                    )
                  }
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_view_week
                  </span>
                  {viewMode === "table" ? "Dạng lịch" : "Dạng bảng"}
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add
                  </span>
                  Thêm lịch học
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <ScheduleStats stats={stats} />

          <ScheduleFilters
            search={search}
            setSearch={setSearch}
            courseClassFilter={courseClassFilter}
            setCourseClassFilter={setCourseClassFilter}
            teacherFilter={teacherFilter}
            setTeacherFilter={setTeacherFilter}
            roomFilter={roomFilter}
            setRoomFilter={setRoomFilter}
            dayFilter={dayFilter}
            setDayFilter={setDayFilter}
            courseClasses={courseClasses}
            teachers={teachers}
            rooms={rooms}
            dayLabels={dayLabels}
            onReset={resetFilters}
          />

          {schedules.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-slate-400 text-3xl">
                  event_busy
                </span>
              </div>

              <h3 className="font-black text-slate-900">
                Không tìm thấy lịch học phù hợp
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Hãy kiểm tra lại từ khóa tìm kiếm hoặc các bộ lọc.
              </p>
            </div>
          ) : viewMode === "table" ? (
            <ScheduleTable
              schedules={schedules}
              dayLabels={dayLabels}
              formatDateInput={formatDateInput}
              formatTime={formatTime}
              isToday={isToday}
              getTeacherAvatar={getTeacherAvatar}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ) : (
            <ScheduleCalendarView
              groupedByDay={groupedByDay}
              dayLabels={dayLabels}
              formatTime={formatTime}
              isToday={isToday}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}

          {showModal && (
            <ScheduleModal
              mode={modalMode}
              formData={formData}
              courseClasses={courseClasses}
              rooms={rooms}
              dayLabels={dayLabels}
              saving={saving}
              onChange={handleChange}
              onClose={closeModal}
              onSubmit={handleSubmit}
            />
          )}
        </main>
      </div>
    </div>
  );
}