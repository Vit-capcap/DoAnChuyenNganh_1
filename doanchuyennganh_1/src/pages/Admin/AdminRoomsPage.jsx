import { useCallback, useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import RoomStats from "../components/admin/RoomStats";
import RoomFilters from "../components/admin/RoomFilters";
import RoomList from "../components/admin/RoomList";
import RoomModal from "../components/admin/RoomModal";

import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../api/roomApi";

const initialForm = {
  id_room: "",
  room_code: "",
  room_name: "",
  building: "",
  floor: "",
  capacity: "",
  camera_ip: "",
  room_status: "ACTIVE",
  camera_name: "",
  camera_location: "",
  camera_status: "ONLINE",
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);

  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [cameraFilter, setCameraFilter] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState(initialForm);

  const fetchRooms = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setMessage("");

        const data = await getRooms({
          search,
          building: buildingFilter,
          room_status: roomStatusFilter,
          camera_status: cameraFilter,
        });

        setRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi lấy phòng học:", error);
        setMessage(error.message || "Không thể tải danh sách phòng học");
      } finally {
        setLoading(false);
      }
    },
    [search, buildingFilter, roomStatusFilter, cameraFilter]
  );

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(async () => {
      if (!isMounted) return;
      await fetchRooms(false);
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchRooms]);

  const buildings = useMemo(() => {
    return Array.from(
      new Set(rooms.map((room) => room.building).filter(Boolean))
    );
  }, [rooms]);

  const stats = useMemo(() => {
    const total = rooms.length;

    const active = rooms.filter((room) => {
      return room.room_status === "ACTIVE";
    }).length;

    const maintenance = rooms.filter((room) => {
      return room.room_status === "MAINTENANCE";
    }).length;

    const cameraOnline = rooms.filter((room) => {
      return room.camera_status === "ONLINE";
    }).length;

    return {
      total,
      active,
      maintenance,
      cameraOnline,
    };
  }, [rooms]);

  const handleResetFilter = () => {
    setSearch("");
    setBuildingFilter("");
    setCameraFilter("");
    setRoomStatusFilter("");
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData(initialForm);
    setShowModal(true);
    setMessage("");
  };

  const openEditModal = (room) => {
    setModalMode("edit");

    setFormData({
      id_room: room.id_room || "",
      room_code: room.room_code || "",
      room_name: room.room_name || "",
      building: room.building || "",
      floor: room.floor || "",
      capacity: room.capacity || "",
      camera_ip: room.camera_ip || room.room_camera_ip || "",
      room_status: room.room_status || "ACTIVE",
      camera_name: room.camera_name || "",
      camera_location: room.camera_location || "",
      camera_status: room.camera_status || "ONLINE",
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
    if (!formData.room_code.trim()) {
      setMessage("Vui lòng nhập mã phòng học");
      return false;
    }

    if (!formData.room_name.trim()) {
      setMessage("Vui lòng nhập tên phòng học");
      return false;
    }

    if (!formData.building.trim()) {
      setMessage("Vui lòng nhập tòa nhà");
      return false;
    }

    if (!formData.capacity || Number(formData.capacity) <= 0) {
      setMessage("Vui lòng nhập sức chứa hợp lệ");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      room_code: formData.room_code.trim(),
      room_name: formData.room_name.trim(),
      building: formData.building.trim(),
      floor: formData.floor || null,
      capacity: Number(formData.capacity),
      camera_ip: formData.camera_ip || null,
      room_status: formData.room_status || "ACTIVE",
      camera_name: formData.camera_name || null,
      camera_location: formData.camera_location || null,
      camera_status: formData.camera_status || "ONLINE",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      const payload = buildPayload();

      if (modalMode === "add") {
        await createRoom(payload);
        alert("Thêm phòng học thành công");
      } else {
        await updateRoom(formData.id_room, payload);
        alert("Cập nhật phòng học thành công");
      }

      closeModal();
      fetchRooms();
    } catch (error) {
      console.error("Lỗi lưu phòng học:", error);
      setMessage(error.message || "Lưu phòng học thất bại");
    }
  };

  const handleDelete = async (room) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa phòng ${room.room_code} - ${room.room_name} không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteRoom(room.id_room);
      alert("Xóa phòng học thành công");
      fetchRooms();
    } catch (error) {
      console.error("Lỗi xóa phòng học:", error);
      setMessage(error.message || "Xóa phòng học thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="rooms" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    meeting_room
                  </span>
                  Quản trị phòng học
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Quản lý phòng học
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Theo dõi phòng học, sức chứa, trạng thái sử dụng và camera
                  phục vụ điểm danh khuôn mặt.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fetchRooms()}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
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
                    add
                  </span>
                  Thêm phòng học
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

          <RoomStats stats={stats} />

          <RoomFilters
            search={search}
            setSearch={setSearch}
            buildingFilter={buildingFilter}
            setBuildingFilter={setBuildingFilter}
            roomStatusFilter={roomStatusFilter}
            setRoomStatusFilter={setRoomStatusFilter}
            cameraFilter={cameraFilter}
            setCameraFilter={setCameraFilter}
            buildings={buildings}
            onReset={handleResetFilter}
          />

          <RoomList
            rooms={rooms}
            loading={loading}
            totalRooms={rooms.length}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />

          {showModal && (
            <RoomModal
              mode={modalMode}
              formData={formData}
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