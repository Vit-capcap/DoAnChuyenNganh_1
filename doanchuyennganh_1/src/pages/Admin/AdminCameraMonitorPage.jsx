import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

const initialForm = {
  id_camera: "",
  camera_name: "",
  camera_ip: "",
  location: "",
  id_room: "",
  status: "ONLINE",
};

function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRoomLabel(camera) {
  if (camera.room_code || camera.room_name) {
    return `${camera.room_code || ""}${
      camera.room_name ? ` - ${camera.room_name}` : ""
    }`;
  }

  return camera.location || "Chưa gán phòng";
}

function getCameraPlaceholder(camera) {
  const room = encodeURIComponent(getRoomLabel(camera));
  return `https://ui-avatars.com/api/?name=${room}&background=111827&color=ffffff&size=512`;
}

function getStudentName(activity) {
  if (activity.full_name) return activity.full_name;

  if (activity.result === "FAILED") return "Khuôn mặt không xác định";

  return "Chưa xác định";
}

export default function AdminCameraMonitorPage() {
  const [cameras, setCameras] = useState([]);
  const [activities, setActivities] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [stats, setStats] = useState({
    total_camera: 0,
    online_camera: 0,
    offline_camera: 0,
    today_faces: 0,
    today_accuracy: 0,
  });

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

    const loadOptions = async () => {
      try {
        const res = await fetch(`${API_URL}/cameras/options`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Không thể tải phòng học");
        }

        if (isMounted) {
          setRooms(Array.isArray(data.rooms) ? data.rooms : []);
        }
      } catch (error) {
        console.error("Lỗi tải options camera:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu phòng học");
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isMounted = true;

    const loadCameras = async () => {
      try {
        const params = new URLSearchParams();

        if (search.trim()) {
          params.append("search", search.trim());
        }

        if (statusFilter) {
          params.append("status", statusFilter);
        }

        if (roomFilter) {
          params.append("id_room", roomFilter);
        }

        const res = await fetch(`${API_URL}/cameras?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Không thể tải danh sách camera");
        }

        if (isMounted) {
          setCameras(Array.isArray(data.cameras) ? data.cameras : []);
          setActivities(Array.isArray(data.activities) ? data.activities : []);
          setStats(
            data.stats || {
              total_camera: 0,
              online_camera: 0,
              offline_camera: 0,
              today_faces: 0,
              today_accuracy: 0,
            }
          );
          setMessage("");
        }
      } catch (error) {
        console.error("Lỗi tải camera:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách camera");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadCameras();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [search, statusFilter, roomFilter, refreshKey]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const intervalId = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const statCards = useMemo(
    () => [
      {
        title: "Tổng camera",
        value: stats.total_camera || 0,
      },
      {
        title: "Đang hoạt động",
        value: stats.online_camera || 0,
        status: "Online",
        color: "green",
      },
      {
        title: "Ngoại tuyến",
        value: stats.offline_camera || 0,
        status: "Offline",
        color: "red",
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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        camera_name: formData.camera_name,
        camera_ip: formData.camera_ip,
        location: formData.location || null,
        id_room: formData.id_room || null,
        status: formData.status || "ONLINE",
      };

      const url =
        modalMode === "add"
          ? `${API_URL}/cameras`
          : `${API_URL}/cameras/${formData.id_camera}`;

      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lưu camera thất bại");
      }

      alert(
        modalMode === "add"
          ? "Thêm camera thành công"
          : "Cập nhật camera thành công"
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
      const res = await fetch(`${API_URL}/cameras/${camera.id_camera}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đổi trạng thái camera thất bại");
      }

      alert(data.message || "Cập nhật trạng thái camera thành công");
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
      const res = await fetch(`${API_URL}/cameras/${camera.id_camera}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xóa camera thất bại");
      }

      alert("Xóa camera thành công");
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
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
      <Sidebar activePage="camera" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6 bg-[#111827] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Camera AI Monitor
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  Giám sát camera AI và luồng nhận diện khuôn mặt theo thời gian
                  thực.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAutoRefresh((prev) => !prev)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
                    autoRefresh
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-white/10 text-gray-300 border-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    sync
                  </span>
                  Auto refresh {autoRefresh ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    videocam
                  </span>
                  Thêm camera
                </button>
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
                {message}
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm camera, IP, phòng..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>

                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả phòng</option>
                  {rooms.map((room) => (
                    <option key={room.id_room} value={room.id_room}>
                      {room.room_code} - {room.room_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-3 bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 rounded-xl text-sm font-semibold"
                >
                  Xóa lọc
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4"
                >
                  <span className="text-xs font-semibold text-gray-400">
                    {item.title}
                  </span>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-4xl font-bold text-white">
                      {item.value}
                    </span>

                    {item.status && (
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
                          item.color === "green"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.color === "green"
                              ? "bg-emerald-400"
                              : "bg-red-400"
                          }`}
                        />
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:col-span-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-gray-400">
                      Số khuôn mặt nhận diện hôm nay
                    </span>

                    <div className="text-4xl font-bold text-white mt-2">
                      {stats.today_faces || 0}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-400">
                      AI Accuracy
                    </span>

                    <div className="text-2xl font-bold text-cyan-400 mt-2">
                      {Number(stats.today_accuracy || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-gray-300 text-sm font-semibold">
                Đang tải danh sách camera...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cameras.length === 0 ? (
                    <div className="md:col-span-2 bg-white/10 border border-white/10 rounded-2xl p-8 text-center text-gray-300">
                      Không có camera nào.
                    </div>
                  ) : (
                    cameras.map((camera) => {
                      const online = camera.status === "ONLINE";

                      return (
                        <div
                          key={camera.id_camera}
                          className={`relative rounded-2xl overflow-hidden border border-white/10 aspect-video group ${
                            online ? "bg-black" : "bg-white/5"
                          }`}
                        >
                          {online ? (
                            <>
                              <div
                                className="absolute inset-0 bg-cover bg-center opacity-80"
                                style={{
                                  backgroundImage: `url(${getCameraPlaceholder(
                                    camera
                                  )})`,
                                }}
                              />

                              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/50" />

                              <div className="absolute inset-0 pointer-events-none">
                                {Number(camera.today_recognition_count || 0) > 0 && (
                                  <>
                                    <div
                                      className="absolute border-2 border-cyan-400/80 bg-cyan-400/10"
                                      style={{
                                        top: "28%",
                                        left: "38%",
                                        width: "18%",
                                        height: "28%",
                                      }}
                                    >
                                      <div className="absolute -top-6 left-0 bg-cyan-400/80 text-black text-[10px] px-1 font-semibold">
                                        ID: AI
                                      </div>
                                    </div>

                                    <div
                                      className="absolute border-2 border-cyan-400/80 bg-cyan-400/10"
                                      style={{
                                        top: "42%",
                                        left: "60%",
                                        width: "12%",
                                        height: "20%",
                                      }}
                                    />
                                  </>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">
                                  videocam_off
                                </span>
                                <p className="text-sm font-semibold text-red-300">
                                  Signal Lost
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-semibold text-white">
                                {camera.camera_name}
                              </h3>

                              <span className="text-[11px] text-gray-300">
                                IP: {camera.camera_ip || "-"} •{" "}
                                {getRoomLabel(camera)}
                              </span>
                            </div>

                            <div
                              className={`w-3 h-3 rounded-full ${
                                online
                                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                  : "bg-red-500"
                              }`}
                            />
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                            <div className="text-xs text-gray-300">
                              Nhận diện hôm nay:{" "}
                              <span className="text-cyan-300 font-semibold">
                                {camera.today_recognition_count || 0}
                              </span>
                              {" "}• Avg:{" "}
                              <span className="text-cyan-300 font-semibold">
                                {Number(camera.avg_confidence || 0).toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => openEditModal(camera)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-500/30 text-white flex items-center justify-center"
                                title="Sửa camera"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleCameraStatus(camera)}
                                className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center ${
                                  online
                                    ? "hover:bg-red-500/30 text-red-200"
                                    : "hover:bg-emerald-500/30 text-emerald-200"
                                }`}
                                title={online ? "Tắt camera" : "Bật camera"}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {online ? "videocam_off" : "videocam"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteCamera(camera)}
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/30 text-red-200 flex items-center justify-center"
                                title="Xóa camera"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col min-h-[360px]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                      Luồng hoạt động
                    </h2>

                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                      <span className="w-2 h-2 rounded-full bg-blue-300" />
                      Live
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2">
                    {activities.length === 0 ? (
                      <div className="text-sm text-gray-400">
                        Chưa có lịch sử nhận diện.
                      </div>
                    ) : (
                      activities.map((item) => (
                        <div
                          key={item.id_history}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                              item.result === "SUCCESS"
                                ? "bg-cyan-500/20 border-cyan-500/30"
                                : "bg-red-500/20 border-red-500/30"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                item.result === "SUCCESS"
                                  ? "text-cyan-400"
                                  : "text-red-300"
                              }`}
                            >
                              {item.result === "SUCCESS" ? "face" : "warning"}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-white">
                              {getStudentName(item)}
                            </p>

                            <div className="flex flex-wrap items-center gap-1 text-gray-400 text-xs mt-1">
                              <span className="material-symbols-outlined text-[12px]">
                                schedule
                              </span>
                              {formatTime(item.capture_time)}

                              <span className="material-symbols-outlined text-[12px] ml-2">
                                location_on
                              </span>
                              {item.room_code || item.location || "Không rõ"}

                              {item.confidence !== null &&
                                item.confidence !== undefined && (
                                  <span className="ml-2 text-cyan-300">
                                    {Number(item.confidence).toFixed(1)}%
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

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
          </div>
        </main>
      </div>
    </div>
  );
}

function CameraModal({
  mode,
  formData,
  rooms,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {mode === "add" ? "Thêm camera" : "Chỉnh sửa camera"}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Cấu hình camera giám sát cho phòng học.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 text-gray-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Tên camera"
              name="camera_name"
              value={formData.camera_name}
              onChange={onChange}
              placeholder="Ví dụ: Cam 01 - Phòng A101"
              required
            />

            <Input
              label="IP camera"
              name="camera_ip"
              value={formData.camera_ip}
              onChange={onChange}
              placeholder="Ví dụ: 192.168.1.50"
              required
            />

            <FormSelect
              label="Phòng học"
              name="id_room"
              value={formData.id_room}
              onChange={onChange}
            >
              <option value="">Chưa gán phòng</option>
              {rooms.map((room) => (
                <option key={room.id_room} value={room.id_room}>
                  {room.room_code} - {room.room_name} - {room.building}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Trạng thái"
              name="status"
              value={formData.status}
              onChange={onChange}
            >
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
            </FormSelect>

            <div className="md:col-span-2">
              <Input
                label="Vị trí"
                name="location"
                value={formData.location}
                onChange={onChange}
                placeholder="Ví dụ: Trước cửa phòng A101"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                save
              </span>
              {saving
                ? "Đang lưu..."
                : mode === "add"
                ? "Thêm camera"
                : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value = "",
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
      />
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 mb-1 block">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
      >
        {children}
      </select>
    </div>
  );
}