import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import CameraStats from "../components/admin/CameraStats";
import CameraFilters from "../components/admin/CameraFilters";
import CameraGrid from "../components/admin/CameraGrid";
import CameraActivityPanel from "../components/admin/CameraActivityPanel";
import CameraModal from "../components/admin/CameraModal";

import {
  getCameraOptions,
  getCameras,
  createCamera,
  updateCamera,
  updateCameraStatus,
  deleteCameraById,
  normalizeList,
} from "../../api/cameraApi";

const initialForm = {
  id_camera: "",
  camera_name: "",
  camera_ip: "",
  location: "",
  id_room: "",
  status: "ONLINE",
};

const emptyStats = {
  total_camera: 0,
  online_camera: 0,
  offline_camera: 0,
  today_faces: 0,
  today_accuracy: 0,
};

function normalizeStats(data) {
  return {
    ...emptyStats,
    ...(data?.stats || {}),
  };
}

function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRoomLabel(camera) {
  const roomCode = camera?.room_code || "";
  const roomName = camera?.room_name || "";

  if (roomCode || roomName) {
    return `${roomCode}${roomName ? ` - ${roomName}` : ""}`;
  }

  return camera?.location || "Chưa gán phòng";
}

function getCameraPlaceholder(camera) {
  const room = encodeURIComponent(getRoomLabel(camera));
  return `https://ui-avatars.com/api/?name=${room}&background=111827&color=ffffff&size=512`;
}

function getStudentName(activity) {
  if (activity?.full_name) return activity.full_name;
  if (activity?.student_code) return activity.student_code;
  if (activity?.result === "FAILED") return "Khuôn mặt không xác định";
  return "Chưa xác định";
}

function safePercent(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(1) : "0.0";
}

export default function AdminCameraMonitorPage() {
  const [cameras, setCameras] = useState([]);
  const [activities, setActivities] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(emptyStats);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      try {
        const data = await getCameraOptions();

        if (!isMounted) return;

        setRooms(normalizeList(data, "rooms"));
      } catch (error) {
        console.error("Lỗi tải phòng học:", error);

        if (isMounted) {
          setRooms([]);
          setMessage(error.message || "Không thể tải danh sách phòng học");
        }
      }
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadCameras() {
      try {
        if (refreshKey === 0) {
          setLoading(true);
        }

        const data = await getCameras(
          {
            search,
            status: statusFilter,
            id_room: roomFilter,
          },
          controller.signal
        );

        if (!isMounted) return;

        setCameras(normalizeList(data, "cameras"));
        setActivities(normalizeList(data, "activities"));
        setStats(normalizeStats(data));
        setMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Lỗi tải camera:", error);

        if (isMounted) {
          setCameras([]);
          setActivities([]);
          setStats(emptyStats);
          setMessage(error.message || "Không thể tải danh sách camera");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadCameras, 300);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [search, statusFilter, roomFilter, refreshKey]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const intervalId = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  const statCards = useMemo(
    () => [
      {
        title: "Tổng camera",
        value: stats.total_camera || 0,
        icon: "videocam",
        textClass: "text-slate-900",
        bgClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Đang hoạt động",
        value: stats.online_camera || 0,
        icon: "sensors",
        textClass: "text-emerald-600",
        bgClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Ngoại tuyến",
        value: stats.offline_camera || 0,
        icon: "videocam_off",
        textClass: "text-rose-600",
        bgClass: "bg-rose-50 text-rose-600",
      },
    ],
    [stats]
  );

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setShowModal(true);
    setMessage("");
  };

  const openEditModal = (camera) => {
    setModalMode("edit");

    setFormData({
      id_camera: camera.id_camera || "",
      camera_name: camera.camera_name || "",
      camera_ip: camera.camera_ip || "",
      location: camera.location || "",
      id_room: camera.id_room || "",
      status: camera.status || "ONLINE",
    });

    setShowModal(true);
    setMessage("");
  };

  const closeModal = () => {
    if (saving) return;

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
    if (!formData.camera_name.trim()) {
      setMessage("Vui lòng nhập tên camera");
      return false;
    }

    if (!formData.camera_ip.trim()) {
      setMessage("Vui lòng nhập IP camera");
      return false;
    }

    if (!formData.status) {
      setMessage("Vui lòng chọn trạng thái camera");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      camera_name: formData.camera_name.trim(),
      camera_ip: formData.camera_ip.trim(),
      location: formData.location.trim() || null,
      id_room: formData.id_room ? Number(formData.id_room) : null,
      status: formData.status || "ONLINE",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const data =
        modalMode === "add"
          ? await createCamera(buildPayload())
          : await updateCamera(formData.id_camera, buildPayload());

      alert(
        data?.message ||
          (modalMode === "add"
            ? "Thêm camera thành công"
            : "Cập nhật camera thành công")
      );

      closeModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu camera:", error);
      setMessage(error.message || "Lưu camera thất bại");
    } finally {
      setSaving(false);
    }
  };

  const toggleCameraStatus = async (camera) => {
    const nextStatus = camera.status === "ONLINE" ? "OFFLINE" : "ONLINE";

    const confirmMessage =
      nextStatus === "OFFLINE"
        ? `Bạn có chắc chắn muốn tắt ${camera.camera_name} không?`
        : `Bạn có chắc chắn muốn bật ${camera.camera_name} không?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const data = await updateCameraStatus(camera.id_camera, nextStatus);

      alert(data?.message || "Cập nhật trạng thái camera thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi đổi trạng thái camera:", error);
      setMessage(error.message || "Đổi trạng thái camera thất bại");
    }
  };

  const deleteCamera = async (camera) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa camera ${camera.camera_name} không?`
    );

    if (!confirmDelete) return;

    try {
      const data = await deleteCameraById(camera.id_camera);

      alert(data?.message || "Xóa camera thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa camera:", error);
      setMessage(error.message || "Xóa camera thất bại");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setRoomFilter("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="cameras" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    linked_camera
                  </span>
                  Giám sát camera AI
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Camera AI Monitor
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Giám sát camera AI, trạng thái thiết bị và luồng nhận diện
                  khuôn mặt theo thời gian thực.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 border transition ${
                    autoRefresh
                      ? "bg-emerald-500/20 text-emerald-100 border-emerald-300/30"
                      : "bg-white/15 text-white border-white/20 hover:bg-white/25"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      autoRefresh ? "animate-spin" : ""
                    }`}
                  >
                    sync
                  </span>
                  Auto refresh {autoRefresh ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    videocam
                  </span>
                  Thêm camera
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

          <div className="space-y-6">
            <CameraFilters
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              roomFilter={roomFilter}
              setRoomFilter={setRoomFilter}
              rooms={rooms}
              onReset={resetFilters}
            />

            <CameraStats
              stats={stats}
              statCards={statCards}
              safePercent={safePercent}
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <CameraGrid
                  cameras={cameras}
                  loading={loading}
                  getRoomLabel={getRoomLabel}
                  getCameraPlaceholder={getCameraPlaceholder}
                  safePercent={safePercent}
                  onEdit={openEditModal}
                  onToggleStatus={toggleCameraStatus}
                  onDelete={deleteCamera}
                />
              </div>

              <div className="xl:col-span-1">
                <CameraActivityPanel
                  activities={activities}
                  getStudentName={getStudentName}
                  formatTime={formatTime}
                  safePercent={safePercent}
                />
              </div>
            </div>
          </div>

          {showModal && (
            <CameraModal
              mode={modalMode}
              formData={formData}
              rooms={rooms}
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