import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = "http://localhost:3060/api";
const FACE_RECOGNIZE_URL = "http://localhost:8001/recognize";

const CLOCK_INTERVAL_MS = 1000;
const RECOGNITION_INTERVAL_MS = 2500;

const OPEN_BEFORE_START_MINUTES = 15;
const LATE_AFTER_START_MINUTES = 15;
const CLOSE_BEFORE_END_MINUTES = 15;

export default function CameraRoomPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const recognizingRef = useRef(false);
  const cameraActiveRef = useRef(false);
  const cameraLoadingRef = useRef(false);
  const autoOpenTriedRef = useRef(false);

  const roomInfoRef = useRef(null);
  const todaySessionRef = useRef(null);
  const recognizeFrameRef = useRef(null);
  const classStudentsRef = useRef([]);

  const [roomName, setRoomName] = useState("");
  const [roomInfo, setRoomInfo] = useState(null);
  const [todaySession, setTodaySession] = useState(null);

  const [classStudents, setClassStudents] = useState([]);
  const [pendingFace, setPendingFace] = useState(null);

  const [checking, setChecking] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const [recognitionResults, setRecognitionResults] = useState([]);
  const [recognizing, setRecognizing] = useState(false);
  const [lastRecognizedAt, setLastRecognizedAt] = useState(null);
  const [confirmingStudentCode, setConfirmingStudentCode] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const showMessage = useCallback((text, type = "info") => {
    setMessage(text || "");
    setMessageType(type);
  }, []);

  const stopCameraStreamOnly = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const resetRecognitionState = useCallback(() => {
    recognizingRef.current = false;
    setRecognizing(false);
    setRecognitionResults([]);
    setLastRecognizedAt(null);
    setConfirmingStudentCode(null);
    setPendingFace(null);
  }, []);

  const stopCamera = useCallback(() => {
    stopCameraStreamOnly();

    cameraActiveRef.current = false;
    recognizingRef.current = false;

    setCameraActive(false);
    resetRecognitionState();
  }, [stopCameraStreamOnly, resetRecognitionState]);

  useEffect(() => {
    roomInfoRef.current = roomInfo;
  }, [roomInfo]);

  useEffect(() => {
    todaySessionRef.current = todaySession;
  }, [todaySession]);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    classStudentsRef.current = classStudents;
  }, [classStudents]);

  const cameraStatus = useMemo(() => {
    return getCameraStatus(todaySession, currentTime);
  }, [todaySession, currentTime]);

  const refreshClassStudents = useCallback(async (idSession) => {
    if (!idSession) return;

    const studentData = await getSessionStudents(idSession);

    setClassStudents(
      Array.isArray(studentData?.students) ? studentData.students : []
    );
  }, []);

  const startCamera = useCallback(
    async (autoStart = false) => {
      const session = todaySessionRef.current;
      const room = roomInfoRef.current;

      if (!room) {
        if (!autoStart) {
          showMessage("Vui lòng kiểm tra phòng trước khi bật camera.", "warning");
        }

        return;
      }

      if (!session) {
        if (!autoStart) {
          showMessage("Phòng hiện chưa có buổi học hôm nay.", "warning");
        }

        return;
      }

      const status = getCameraStatus(session, new Date());

      if (!status.canOpen) {
        if (!autoStart) {
          showMessage(status.description, "warning");
        }

        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        showMessage("Trình duyệt hiện tại không hỗ trợ mở camera.", "error");
        return;
      }

      if (cameraActiveRef.current || cameraLoadingRef.current) {
        return;
      }

      cameraLoadingRef.current = true;
      setCameraLoading(true);
      setMessage("");

      try {
        // Yêu cầu quyền truy cập camera và lấy luồng video
        // WebRTC = công nghệ để web bật camera và lấy video trực tiếp
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        resetRecognitionState();

        cameraActiveRef.current = true;
        setCameraActive(true);

        showMessage(
          autoStart
            ? "Camera đã tự động mở theo thời gian quy định. Khi nhận diện đúng, sinh viên cần bấm OK để xác nhận điểm danh."
            : "Camera đã được bật. Khi nhận diện đúng, sinh viên cần bấm OK để xác nhận điểm danh.",
          "success"
        );
      } catch (error) {
        console.error("Lỗi mở camera:", error);

        showMessage(
          autoStart
            ? "Đã đến giờ mở camera nhưng trình duyệt chưa cho phép truy cập camera. Vui lòng bấm Bật camera."
            : "Không thể mở camera. Vui lòng cho phép trình duyệt truy cập camera.",
          "error"
        );
      } finally {
        cameraLoadingRef.current = false;
        setCameraLoading(false);
      }
    },
    [resetRecognitionState, showMessage]
  );

  const recognizeCurrentFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const session = todaySessionRef.current;
    const room = roomInfoRef.current;

    if (!video || !canvas) return;
    if (!cameraActiveRef.current) return;
    if (recognizingRef.current) return;
    if (pendingFace) return;

    if (!session?.id_session) {
      showMessage("Vui lòng kiểm tra phòng và buổi học trước.", "warning");
      return;
    }

    const status = getCameraStatus(session, new Date());

    if (!status.canOpen) {
      stopCamera();
      showMessage(status.description, "warning");
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageBase64 = canvas.toDataURL("image/jpeg", 0.85);

    recognizingRef.current = true;
    setRecognizing(true);

    try {
      const data = await recognizeFace({
        imageBase64,
        idSession: session.id_session,
        cameraId: getCameraId(room),
      });

      const faces = normalizeFaces(data?.faces);

      setLastRecognizedAt(new Date());

      const validFace = faces.find(
        (face) =>
          face.status === "WAITING_CONFIRM" &&
          face.student_code &&
          face.full_name
      );

      const unknownFace = faces.find((face) => face.status === "UNKNOWN");

      if (validFace) {
        const studentsInClass = classStudentsRef.current || [];
        const studentBelongsToClass = isStudentInClass(
          validFace,
          studentsInClass
        );

        if (!studentBelongsToClass) {
          const blockedFace = {
            ...validFace,
            status: "NOT_IN_SESSION",
            result: "FAILED",
            message: "Sinh viên này không học lớp này nên không được điểm danh.",
          };

          setPendingFace(null);
          setRecognitionResults([blockedFace]);

          showMessage(
            `${validFace.student_code} - ${validFace.full_name} không học lớp này, không được điểm danh.`,
            "error"
          );

          return;
        }

        const expectedStatus = getAttendanceStatusBySessionTime(
          session,
          new Date()
        );

        const faceWithImage = {
          ...validFace,
          imageBase64,
          expectedStatus,
        };

        setPendingFace(faceWithImage);
        setRecognitionResults([faceWithImage]);

        showMessage(
          `Đã nhận diện: ${validFace.student_code} - ${validFace.full_name}. Chờ sinh viên bấm OK để lưu điểm danh.`,
          "success"
        );

        return;
      }

      if (unknownFace) {
        setPendingFace(null);
        setRecognitionResults(faces);
        showMessage("Không xác định được sinh viên. Vui lòng thử lại.", "warning");
        return;
      }

      setPendingFace(null);
      setRecognitionResults(faces);

      if (faces.length === 0) {
        showMessage("Chưa phát hiện khuôn mặt.", "info");
      }
    } catch (error) {
      console.error("Lỗi nhận diện khuôn mặt:", error);

      showMessage(
        error.message ||
          "Không thể kết nối API nhận diện khuôn mặt. Kiểm tra Python service ở port 8001.",
        "error"
      );
    } finally {
      recognizingRef.current = false;
      setRecognizing(false);
    }
  }, [pendingFace, showMessage, stopCamera]);

  useEffect(() => {
    recognizeFrameRef.current = recognizeCurrentFrame;
  }, [recognizeCurrentFrame]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();

      setCurrentTime(now);

      const session = todaySessionRef.current;
      if (!session) return;

      const status = getCameraStatus(session, now);

      if (cameraActiveRef.current && !status.canOpen) {
        stopCameraStreamOnly();

        cameraActiveRef.current = false;
        recognizingRef.current = false;

        setCameraActive(false);
        setRecognizing(false);
        setRecognitionResults([]);
        setLastRecognizedAt(null);
        setConfirmingStudentCode(null);
        setPendingFace(null);

        setMessage(status.description);
        setMessageType("warning");

        return;
      }

      if (!cameraActiveRef.current && status.canOpen) {
        if (!autoOpenTriedRef.current && !cameraLoadingRef.current) {
          autoOpenTriedRef.current = true;
          startCamera(true);
        }
      }

      if (!status.canOpen && status.type === "waiting") {
        autoOpenTriedRef.current = false;
      }
    }, CLOCK_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [startCamera, stopCameraStreamOnly]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!cameraActiveRef.current) return;
      if (!recognizeFrameRef.current) return;
      if (pendingFace) return;

      recognizeFrameRef.current();
    }, RECOGNITION_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [pendingFace]);

  useEffect(() => {
    return () => {
      stopCameraStreamOnly();
      cameraActiveRef.current = false;
      recognizingRef.current = false;
    };
  }, [stopCameraStreamOnly]);

  const handleCheckRoom = async (event) => {
    event.preventDefault();

    const keyword = roomName.trim();

    if (!keyword) {
      showMessage("Vui lòng nhập tên phòng hoặc mã phòng.", "warning");
      return;
    }

    setChecking(true);
    setRoomInfo(null);
    setTodaySession(null);
    setClassStudents([]);
    setMessage("");

    autoOpenTriedRef.current = false;

    resetRecognitionState();
    stopCamera();

    try {
      const roomData = await checkRoom(keyword);

      if (!roomData?.exists || !roomData?.room) {
        showMessage("Phòng không tồn tại trong hệ thống.", "error");
        return;
      }

      const foundRoom = roomData.room;

      setRoomInfo(foundRoom);
      roomInfoRef.current = foundRoom;

      const sessionData = await getTodaySession(foundRoom.id_room);
      const session = sessionData?.session || null;

      if (!sessionData?.hasSession || !session) {
        showMessage(
          "Phòng tồn tại, nhưng hôm nay phòng này không có lịch học.",
          "warning"
        );
        return;
      }

      setTodaySession(session);
      todaySessionRef.current = session;

      await refreshClassStudents(session.id_session);

      const status = getCameraStatus(session, new Date());

      if (status.canOpen) {
        showMessage(
          "Đã tìm thấy buổi học hiện tại của phòng. Camera sẽ được mở theo thời gian quy định.",
          "success"
        );

        await startCamera(true);
      } else {
        showMessage(
          `Đã tìm thấy lịch học, nhưng ${status.description}`,
          "warning"
        );
      }
    } catch (error) {
      console.error("Lỗi kiểm tra phòng:", error);
      showMessage(error.message || "Có lỗi xảy ra khi kiểm tra phòng.", "error");
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmAttendance = async (face) => {
    const session = todaySessionRef.current;
    const room = roomInfoRef.current;

    if (!session?.id_session) {
      showMessage("Không tìm thấy buổi học hiện tại.", "error");
      return;
    }

    const cameraStatusNow = getCameraStatus(session, new Date());

    if (!cameraStatusNow.canOpen) {
      stopCamera();

      showMessage(
        "Camera đã đóng theo thời gian quy định. Không thể xác nhận điểm danh.",
        "warning"
      );

      return;
    }

    if (!face?.student_code) {
      showMessage("Không tìm thấy mã sinh viên để xác nhận.", "error");
      return;
    }

    if (face.status !== "WAITING_CONFIRM") {
      showMessage("Khuôn mặt này chưa ở trạng thái chờ xác nhận.", "warning");
      return;
    }

    const studentsInClass = classStudentsRef.current || [];
    const studentBelongsToClass = isStudentInClass(face, studentsInClass);

    if (!studentBelongsToClass) {
      setPendingFace(null);

      setRecognitionResults((prev) =>
        prev.map((item) =>
          item.student_code === face.student_code
            ? {
                ...item,
                status: "NOT_IN_SESSION",
                result: "FAILED",
                message:
                  "Sinh viên này không học lớp này nên không được điểm danh.",
              }
            : item
        )
      );

      showMessage(
        `${face.student_code} - ${face.full_name} không học lớp này, không được điểm danh.`,
        "error"
      );

      return;
    }

    const expectedStatus = getAttendanceStatusBySessionTime(session, new Date());

    setConfirmingStudentCode(face.student_code);

    try {
      const data = await saveFaceAttendance({
        idSession: session.id_session,
        studentCode: face.student_code,
        confidence: face.confidence,
        faceImage: face.imageBase64,
        cameraId: getCameraId(room),
        expectedStatus,
      });

      const savedStatus = normalizeSavedAttendanceStatus(
        data?.status,
        expectedStatus
      );

      showMessage(
        savedStatus === "LATE"
          ? "Đã lưu điểm danh đi trễ"
          : data?.message || "Đã lưu điểm danh thành công",
        "success"
      );

      setPendingFace(null);

      setRecognitionResults((prev) =>
        prev.map((item) =>
          item.student_code === face.student_code
            ? {
                ...item,
                status: savedStatus,
                result: "SUCCESS",
                message:
                  savedStatus === "LATE"
                    ? "Đã lưu điểm danh đi trễ vào MySQL."
                    : "Đã lưu điểm danh vào MySQL.",
              }
            : item
        )
      );

      await refreshClassStudents(session.id_session);

      setClassStudents((prev) =>
        prev.map((student) =>
          String(student.student_code) === String(face.student_code) ||
          Number(student.id_student) === Number(face.id_student)
            ? {
                ...student,
                display_status: savedStatus,
                attendance_status: savedStatus,
                status: savedStatus,
                check_in_time: new Date().toISOString(),
              }
            : student
        )
      );
    } catch (error) {
      console.error("Lỗi lưu điểm danh:", error);
      showMessage(error.message || "Không thể lưu điểm danh.", "error");
    } finally {
      setConfirmingStudentCode(null);
    }
  };

  const handleCancelConfirm = () => {
    setPendingFace(null);
    setRecognitionResults([]);
    showMessage("Đã hủy xác nhận. Hệ thống tiếp tục nhận diện.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <span className="material-symbols-outlined text-[20px]">
                  photo_camera
                </span>
                Camera điểm danh phòng học
              </div>

              <h1 className="text-3xl font-bold md:text-4xl">
                Đăng nhập phòng để mở camera
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-blue-50">
                Nhập tên phòng hoặc mã phòng để kiểm tra lịch học hôm nay. Camera
                sẽ mở trước giờ học 15 phút và đóng trước khi kết thúc 15 phút.
                Khi AI nhận diện đúng, sinh viên bấm OK thì hệ thống mới lưu
                điểm danh vào MySQL.
              </p>
            </div>

            <div className="rounded-3xl bg-white/15 px-5 py-4 text-right backdrop-blur">
              <p className="text-sm font-semibold text-blue-50">
                Thời gian hiện tại
              </p>

              <p className="mt-1 text-3xl font-bold">
                {currentTime.toLocaleTimeString("vi-VN")}
              </p>

              <p className="mt-1 text-sm text-blue-50">
                {currentTime.toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {message && <MessageBox type={messageType} message={message} />}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-1">
            <Section title="Nhập thông tin phòng" icon="meeting_room">
              <form onSubmit={handleCheckRoom} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-600">
                    Tên phòng / Mã phòng
                  </label>

                  <input
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                    placeholder="Ví dụ: A101, PM01, Phòng máy 1..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={checking}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    search
                  </span>
                  {checking ? "Đang kiểm tra..." : "Kiểm tra phòng"}
                </button>
              </form>
            </Section>

            <Section title="Thông tin phòng" icon="info">
              {roomInfo ? (
                <div className="space-y-3">
                  <InfoRow label="Mã phòng" value={roomInfo.room_code || "—"} />
                  <InfoRow label="Tên phòng" value={roomInfo.room_name || "—"} />
                  <InfoRow label="Tòa nhà" value={roomInfo.building || "—"} />
                  <InfoRow label="Tầng" value={roomInfo.floor || "—"} />
                  <InfoRow label="Sức chứa" value={roomInfo.capacity || "—"} />
                  <InfoRow
                    label="IP camera"
                    value={
                      roomInfo.camera_ip ||
                      roomInfo.ip_address ||
                      "Camera trình duyệt"
                    }
                  />
                  <InfoRow
                    label="Trạng thái"
                    value={
                      roomInfo.status === "ACTIVE" ? "Đang hoạt động" : "Bảo trì"
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon="meeting_room"
                  title="Chưa có thông tin phòng"
                  description="Nhập tên phòng hoặc mã phòng để kiểm tra."
                />
              )}
            </Section>

            <Section title="Buổi học hôm nay" icon="event_available">
              {todaySession ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                      Môn học
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {todaySession.subject_name || "—"}
                    </h3>

                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p>
                        Lớp học phần:{" "}
                        <span className="font-bold">
                          {todaySession.class_code || "—"}
                        </span>
                      </p>

                      <p>
                        Giáo viên:{" "}
                        <span className="font-bold">
                          {todaySession.teacher_name || "—"}
                        </span>
                      </p>

                      <p>
                        Ngày học:{" "}
                        <span className="font-bold">
                          {formatDate(todaySession.session_date)}
                        </span>
                      </p>

                      <p>
                        Thứ:{" "}
                        <span className="font-bold">
                          {formatDay(todaySession.day_of_week)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard
                      icon="schedule"
                      label="Giờ bắt đầu"
                      value={formatTime(todaySession.start_time)}
                    />

                    <MiniCard
                      icon="event_busy"
                      label="Giờ kết thúc"
                      value={formatTime(todaySession.end_time)}
                    />

                    <MiniCard
                      icon="videocam"
                      label="Camera mở"
                      value={formatOpenTime(
                        todaySession.session_date,
                        todaySession.start_time
                      )}
                    />

                    <MiniCard
                      icon="schedule"
                      label="Tính đi trễ từ"
                      value={formatLateTime(
                        todaySession.session_date,
                        todaySession.start_time
                      )}
                    />

                    <MiniCard
                      icon="lock_clock"
                      label="Camera đóng"
                      value={formatCloseTime(
                        todaySession.session_date,
                        todaySession.end_time
                      )}
                    />
                  </div>

                  <StatusBox status={cameraStatus} />
                </div>
              ) : (
                <EmptyState
                  icon="event_busy"
                  title="Chưa có buổi học"
                  description="Sau khi kiểm tra phòng, buổi học hôm nay sẽ hiển thị ở đây."
                />
              )}
            </Section>
          </div>

          <div className="space-y-6 xl:col-span-2">
            <Section title="Camera nhận diện" icon="videocam">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
                <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-900 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        cameraActive ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />

                    <span className="text-sm font-bold text-white">
                      {cameraActive
                        ? "Camera đang hoạt động"
                        : "Camera đang tắt"}
                    </span>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                    {cameraStatus.label}
                  </span>
                </div>

                <div className="relative flex aspect-video items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${
                      cameraActive ? "block" : "hidden"
                    }`}
                  />

                  <canvas ref={canvasRef} className="hidden" />

                  {!cameraActive && (
                    <div className="flex flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10">
                        <span className="material-symbols-outlined text-6xl text-white">
                          videocam_off
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-white">
                        Camera chưa được bật
                      </h3>

                      <p className="mt-2 max-w-xl text-sm text-slate-400">
                        {cameraStatus.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-900 p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-300">
                    {todaySession ? (
                      <>
                        Thời gian học:{" "}
                        <span className="font-bold text-white">
                          {formatTime(todaySession.start_time)} -{" "}
                          {formatTime(todaySession.end_time)}
                        </span>

                        <span className="mx-2 text-slate-500">|</span>

                        Camera mở lúc{" "}
                        <span className="font-bold text-white">
                          {formatOpenTime(
                            todaySession.session_date,
                            todaySession.start_time
                          )}
                        </span>

                        <span className="mx-2 text-slate-500">|</span>

                        Đi trễ từ{" "}
                        <span className="font-bold text-white">
                          {formatLateTime(
                            todaySession.session_date,
                            todaySession.start_time
                          )}
                        </span>

                        <span className="mx-2 text-slate-500">|</span>

                        Camera đóng lúc{" "}
                        <span className="font-bold text-white">
                          {formatCloseTime(
                            todaySession.session_date,
                            todaySession.end_time
                          )}
                        </span>
                      </>
                    ) : (
                      "Bạn cần kiểm tra phòng và có buổi học hôm nay để bật camera."
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => startCamera(false)}
                      disabled={cameraLoading || cameraActive}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        play_arrow
                      </span>
                      {cameraLoading ? "Đang mở..." : "Bật camera"}
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      disabled={!cameraActive}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        stop
                      </span>
                      Tắt camera
                    </button>

                    <button
                      type="button"
                      onClick={recognizeCurrentFrame}
                      disabled={
                        !cameraActive || recognizing || !cameraStatus.canOpen
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        person_search
                      </span>
                      {recognizing ? "Đang nhận diện..." : "Nhận diện ngay"}
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            {pendingFace && (
              <PendingConfirmPanel
                face={pendingFace}
                onConfirm={handleConfirmAttendance}
                onCancel={handleCancelConfirm}
                confirmingStudentCode={confirmingStudentCode}
              />
            )}

            <RecognitionResultPanel
              results={recognitionResults}
              recognizing={recognizing}
              lastRecognizedAt={lastRecognizedAt}
              onConfirm={handleConfirmAttendance}
              confirmingStudentCode={confirmingStudentCode}
            />

            <ClassStudentAttendancePanel students={classStudents} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   API FUNCTIONS
========================================================= */

async function checkRoom(roomName) {
  const res = await fetch(
    `${API_URL}/cameras/room/check?roomName=${encodeURIComponent(roomName)}`
  );

  return handleResponse(res, "Không thể kiểm tra phòng");
}

async function getTodaySession(idRoom) {
  const res = await fetch(
    `${API_URL}/cameras/room/today-session?id_room=${encodeURIComponent(idRoom)}`
  );

  return handleResponse(res, "Không thể kiểm tra lịch học hôm nay");
}

async function getSessionStudents(idSession) {
  const res = await fetch(
    `${API_URL}/attendance/session/${encodeURIComponent(idSession)}/students`
  );

  return handleResponse(res, "Không thể tải danh sách sinh viên trong lớp");
}

async function recognizeFace({ imageBase64, idSession, cameraId }) {
  const res = await fetch(FACE_RECOGNIZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
      image_base64: imageBase64,
      id_session: Number(idSession),
      camera_id: cameraId || null,
    }),
  });

  return handleResponse(res, "Không thể nhận diện khuôn mặt");
}

async function saveFaceAttendance({
  idSession,
  studentCode,
  confidence,
  faceImage,
  cameraId,
  expectedStatus,
}) {
  const res = await fetch(`${API_URL}/attendance/face-confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_session: Number(idSession),
      student_code: studentCode,
      confidence: Number(confidence || 0),
      face_image: faceImage || null,
      camera_id: cameraId || null,

      /*
        Gửi thêm để backend có thể tham khảo.
        Backend Express nên tự tính lại theo session.start_time để an toàn.
      */
      expected_status: expectedStatus,
      client_check_time: new Date().toISOString(),
    }),
  });

  return handleResponse(res, "Không thể lưu điểm danh");
}

async function handleResponse(res, defaultMessage) {
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    console.error("API không trả về JSON:", {
      url: res.url,
      status: res.status,
      response: text,
    });

    throw new Error(
      `API không trả về JSON. URL lỗi: ${res.url}. Status: ${res.status}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || defaultMessage);
  }

  return data;
}

/* =========================================================
   FACE HELPERS
========================================================= */

function normalizeFaces(faces) {
  if (!Array.isArray(faces)) return [];

  return faces.map((face) => {
    const parsed = parseFaceLabel(face.label);

    const rawStatus = face.status || "";
    const isUnknown =
      rawStatus === "LOW_CONFIDENCE" ||
      rawStatus === "UNKNOWN" ||
      !face.label ||
      face.label === "Unknown" ||
      parsed.code === "Không xác định";

    const studentCode =
      face.student_code ?? face.code ?? parsed.code ?? face.label ?? "";

    const fullName =
      face.full_name ?? face.student_name ?? face.name ?? parsed.name ?? "";

    return {
      ...face,
      id_student: face.id_student ?? face.student_id ?? null,
      student_code: studentCode,
      full_name: fullName,
      confidence: Number(face.confidence || 0),
      status: isUnknown ? "UNKNOWN" : rawStatus || "WAITING_CONFIRM",
      result: isUnknown ? "FAILED" : face.result || "SUCCESS",
    };
  });
}

function parseFaceLabel(label) {
  if (!label || label === "Unknown") {
    return {
      code: "Không xác định",
      name: "Không xác định",
    };
  }

  const text = String(label).trim();
  const parts = text.split("_");

  return {
    code: parts[0] || "Không xác định",
    name: parts.length > 1 ? parts.slice(1).join(" ") : text,
  };
}

function getCameraId(room) {
  return room?.id_camera || room?.id_camera_device || room?.camera_id || null;
}

function isStudentInClass(face, students) {
  if (!face || !Array.isArray(students)) return false;

  const faceStudentCode = String(face.student_code || "").trim();
  const faceStudentId = Number(face.id_student || 0);

  return students.some((student) => {
    const studentCode = String(student.student_code || "").trim();
    const studentId = Number(student.id_student || 0);

    if (faceStudentCode && studentCode && faceStudentCode === studentCode) {
      return true;
    }

    if (faceStudentId && studentId && faceStudentId === studentId) {
      return true;
    }

    return false;
  });
}

/* =========================================================
   CAMERA TIME LOGIC
========================================================= */

function getCameraStatus(session, now = new Date()) {
  if (!session) {
    return {
      canOpen: false,
      type: "empty",
      label: "Chưa có buổi học",
      description:
        "Phòng này hiện chưa có buổi học hôm nay. Vui lòng kiểm tra đúng phòng hoặc chờ đến giờ học.",
    };
  }

  const startDateTime = buildDateTime(session.session_date, session.start_time);
  const endDateTime = buildDateTime(session.session_date, session.end_time);

  if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) {
    return {
      canOpen: false,
      type: "error",
      label: "Dữ liệu thời gian không hợp lệ",
      description:
        "Lịch học trả về từ backend thiếu ngày học, giờ bắt đầu hoặc giờ kết thúc.",
    };
  }

  const cameraOpenTime = new Date(
    startDateTime.getTime() - OPEN_BEFORE_START_MINUTES * 60 * 1000
  );

  const lateTime = new Date(
    startDateTime.getTime() + LATE_AFTER_START_MINUTES * 60 * 1000
  );

  const cameraCloseTime = new Date(
    endDateTime.getTime() - CLOSE_BEFORE_END_MINUTES * 60 * 1000
  );

  if (now < cameraOpenTime) {
    return {
      canOpen: false,
      type: "waiting",
      label: "Chưa đến giờ mở camera",
      description: `Camera sẽ tự động được phép mở từ ${formatOnlyTime(
        cameraOpenTime
      )}.`,
      cameraOpenTime,
      lateTime,
      cameraCloseTime,
    };
  }

  if (now >= cameraOpenTime && now < startDateTime) {
    return {
      canOpen: true,
      type: "pre_open",
      label: "Camera đã được phép mở sớm",
      description: `Camera đang mở sớm trước giờ học. Giờ học bắt đầu lúc ${formatOnlyTime(
        startDateTime
      )}.`,
      cameraOpenTime,
      lateTime,
      cameraCloseTime,
    };
  }

  if (now >= startDateTime && now < lateTime) {
    return {
      canOpen: true,
      type: "active",
      label: "Đang trong giờ điểm danh đúng giờ",
      description: `Sinh viên điểm danh trước ${formatOnlyTime(
        lateTime
      )} sẽ được tính là có mặt đúng giờ.`,
      cameraOpenTime,
      lateTime,
      cameraCloseTime,
    };
  }

  if (now >= lateTime && now < cameraCloseTime) {
    return {
      canOpen: true,
      type: "late",
      label: "Đang trong giờ điểm danh đi trễ",
      description: `Sinh viên điểm danh từ ${formatOnlyTime(
        lateTime
      )} sẽ được tính là đi trễ.`,
      cameraOpenTime,
      lateTime,
      cameraCloseTime,
    };
  }

  if (now >= cameraCloseTime && now <= endDateTime) {
    return {
      canOpen: false,
      type: "locked",
      label: "Camera đã tự động đóng",
      description: `Camera đã đóng lúc ${formatOnlyTime(
        cameraCloseTime
      )}, trước khi kết thúc buổi học 15 phút.`,
      cameraOpenTime,
      lateTime,
      cameraCloseTime,
    };
  }

  return {
    canOpen: false,
    type: "finished",
    label: "Buổi học đã kết thúc",
    description:
      "Buổi học đã kết thúc. Camera không còn được phép mở để điểm danh.",
    cameraOpenTime,
    lateTime,
    cameraCloseTime,
  };
}

function getAttendanceStatusBySessionTime(session, now = new Date()) {
  const startDateTime = buildDateTime(session?.session_date, session?.start_time);

  if (!isValidDate(startDateTime)) return "PRESENT";

  const lateTime = new Date(
    startDateTime.getTime() + LATE_AFTER_START_MINUTES * 60 * 1000
  );

  return now >= lateTime ? "LATE" : "PRESENT";
}

function normalizeSavedAttendanceStatus(serverStatus, expectedStatus) {
  const status = String(serverStatus || "").toUpperCase();

  if (status === "LATE") return "LATE";
  if (status === "PRESENT") return "PRESENT";
  if (status === "ABSENT") return "ABSENT";

  /*
    Nếu backend cũ trả ATTENDANCE_CONFIRMED thì frontend vẫn hiển thị đúng
    theo thời gian hiện tại.
  */
  if (expectedStatus === "LATE") return "LATE";

  return "PRESENT";
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Section({ title, icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="material-symbols-outlined rounded-2xl bg-blue-50 p-2 text-blue-600">
          {icon}
        </span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>

      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>

      <span className="text-right text-sm font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function MiniCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="material-symbols-outlined text-blue-600">{icon}</span>

      <p className="mt-2 text-xs font-bold text-slate-500">{label}</p>

      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <span className="material-symbols-outlined text-5xl text-slate-400">
        {icon}
      </span>

      <h3 className="mt-3 text-sm font-bold text-slate-800">{title}</h3>

      <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
    </div>
  );
}

function MessageBox({ type, message }) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  const icons = {
    success: "check_circle",
    warning: "warning",
    error: "error",
    info: "info",
  };

  return (
    <div
      className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
        styles[type] || styles.info
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">
        {icons[type] || icons.info}
      </span>

      {message}
    </div>
  );
}

function StatusBox({ status }) {
  const styles = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pre_open: "border-blue-200 bg-blue-50 text-blue-700",
    late: "border-amber-200 bg-amber-50 text-amber-700",
    waiting: "border-blue-200 bg-blue-50 text-blue-700",
    locked: "border-amber-200 bg-amber-50 text-amber-700",
    finished: "border-slate-200 bg-slate-50 text-slate-700",
    empty: "border-slate-200 bg-slate-50 text-slate-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  const icons = {
    active: "radio_button_checked",
    pre_open: "videocam",
    late: "schedule",
    waiting: "schedule",
    locked: "lock",
    finished: "event_busy",
    empty: "info",
    error: "error",
  };

  return (
    <div
      className={`rounded-3xl border px-4 py-4 ${
        styles[status.type] || styles.empty
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-bold">
        <span className="material-symbols-outlined text-[20px]">
          {icons[status.type] || icons.empty}
        </span>

        {status.label}
      </div>

      <p className="mt-1 text-xs font-semibold opacity-80">
        {status.description}
      </p>
    </div>
  );
}

function PendingConfirmPanel({
  face,
  onConfirm,
  onCancel,
  confirmingStudentCode,
}) {
  const expectedStatus = face.expectedStatus || "PRESENT";

  return (
    <Section title="Xác nhận điểm danh" icon="verified_user">
      <div
        className={`rounded-3xl border p-5 ${
          expectedStatus === "LATE"
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-wide ${
                expectedStatus === "LATE" ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              Đã nhận diện sinh viên
            </p>

            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              {face.full_name}
            </h3>

            <p className="mt-1 text-sm font-bold text-slate-700">
              Mã sinh viên: {face.student_code}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              Độ tin cậy: {(Number(face.confidence || 0) * 100).toFixed(1)}%
            </p>

            <p
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                expectedStatus === "LATE"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {expectedStatus === "LATE"
                ? "Nếu bấm OK lúc này sẽ lưu là ĐI TRỄ"
                : "Nếu bấm OK lúc này sẽ lưu là CÓ MẶT"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-[160px]">
            <button
              type="button"
              onClick={() => onConfirm(face)}
              disabled={confirmingStudentCode === face.student_code}
              className={`rounded-2xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
                expectedStatus === "LATE"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {confirmingStudentCode === face.student_code
                ? "Đang lưu..."
                : "OK xác nhận"}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={confirmingStudentCode === face.student_code}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function RecognitionResultPanel({
  results,
  recognizing,
  lastRecognizedAt,
  onConfirm,
  confirmingStudentCode,
}) {
  return (
    <Section title="Kết quả nhận diện" icon="person_search">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Danh sách khuôn mặt phát hiện
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {lastRecognizedAt
              ? `Cập nhật lúc ${lastRecognizedAt.toLocaleTimeString("vi-VN")}`
              : "Chưa có dữ liệu nhận diện"}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
            recognizing
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {recognizing ? "sync" : "check_circle"}
          </span>

          {recognizing ? "Đang nhận diện..." : "Sẵn sàng"}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-400">
            face
          </span>

          <p className="mt-3 text-sm font-bold text-slate-700">
            Chưa phát hiện khuôn mặt
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Khi camera phát hiện khuôn mặt, kết quả sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((face, index) => {
            const confidence = Number(face.confidence || 0);

            const isWaiting = face.status === "WAITING_CONFIRM";
            const isLate = face.status === "LATE";
            const isPresent =
              face.status === "PRESENT" ||
              face.status === "ATTENDANCE_CONFIRMED" ||
              face.status === "ATTENDANCE_SAVED";

            const isConfirmed = isPresent || isLate;
            const isBlocked = face.status === "NOT_IN_SESSION";
            const isSuccess = isWaiting || isConfirmed;

            return (
              <div
                key={`${face.student_code || face.label || "face"}-${index}`}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      isLate
                        ? "bg-amber-50 text-amber-600"
                        : isSuccess
                          ? "bg-emerald-50 text-emerald-600"
                          : isBlocked
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {isLate
                        ? "schedule"
                        : isSuccess
                          ? "person_check"
                          : isBlocked
                            ? "block"
                            : "person_off"}
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      {face.full_name || "Không xác định"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Mã SV: {face.student_code || "Không xác định"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Trạng thái: {translateFaceStatus(face.status)}
                    </p>

                    {face.message && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {face.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isLate
                        ? "bg-amber-100 text-amber-700"
                        : isPresent
                          ? "bg-emerald-100 text-emerald-700"
                          : isWaiting
                            ? "bg-blue-100 text-blue-700"
                            : isBlocked
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isLate
                      ? "Đi trễ"
                      : isPresent
                        ? "Đã điểm danh"
                        : isWaiting
                          ? "Chờ xác nhận"
                          : isBlocked
                            ? "Không học lớp này"
                            : "Chưa hợp lệ"}
                  </span>

                  <span className="text-sm font-bold text-slate-700">
                    {(confidence * 100).toFixed(1)}%
                  </span>

                  {isWaiting && (
                    <button
                      type="button"
                      onClick={() => onConfirm(face)}
                      disabled={confirmingStudentCode === face.student_code}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {confirmingStudentCode === face.student_code
                        ? "Đang lưu..."
                        : "OK xác nhận"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function ClassStudentAttendancePanel({ students }) {
  return (
    <Section title="Danh sách sinh viên trong lớp" icon="groups">
      {students.length === 0 ? (
        <EmptyState
          icon="groups"
          title="Chưa có danh sách sinh viên"
          description="Sau khi kiểm tra phòng và buổi học, danh sách sinh viên sẽ hiển thị tại đây."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="grid grid-cols-12 bg-slate-100 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <div className="col-span-3">Mã SV</div>
            <div className="col-span-4">Họ tên</div>
            <div className="col-span-3">Thời gian</div>
            <div className="col-span-2 text-right">Trạng thái</div>
          </div>

          <div className="divide-y divide-slate-100 bg-white">
            {students.map((student) => (
              <div
                key={student.id_student}
                className="grid grid-cols-12 items-center px-4 py-3 text-sm"
              >
                <div className="col-span-3 font-bold text-slate-800">
                  {student.student_code}
                </div>

                <div className="col-span-4 font-semibold text-slate-700">
                  {student.full_name}
                </div>

                <div className="col-span-3 text-slate-500">
                  {formatCheckIn(student.check_in_time)}
                </div>

                <div className="col-span-2 text-right">
                  <AttendanceBadge
                    status={
                      student.display_status ||
                      student.attendance_status ||
                      student.status
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function AttendanceBadge({ status }) {
  const normalizedStatus = String(status || "NOT_MARKED").toUpperCase();

  const config = {
    PRESENT: {
      label: "Đã điểm danh",
      className: "bg-emerald-100 text-emerald-700",
    },
    LATE: {
      label: "Đi trễ",
      className: "bg-amber-100 text-amber-700",
    },
    ABSENT: {
      label: "Vắng",
      className: "bg-red-100 text-red-700",
    },
    NOT_MARKED: {
      label: "Chưa điểm danh",
      className: "bg-slate-100 text-slate-600",
    },
  };

  const item = config[normalizedStatus] || config.NOT_MARKED;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>
      {item.label}
    </span>
  );
}

/* =========================================================
   FORMAT HELPERS
========================================================= */

function normalizeDateOnly(value) {
  if (!value) return "";

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (!isValidDate(date)) {
    return text.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function buildDateTime(dateString, timeString) {
  const safeDate = normalizeDateOnly(dateString);
  const safeTime = String(timeString || "00:00:00").slice(0, 8);

  if (!safeDate) return new Date("Invalid Date");

  return new Date(`${safeDate}T${safeTime}`);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatTime(timeString) {
  if (!timeString) return "—";
  return String(timeString).slice(0, 5);
}

function formatOnlyTime(date) {
  if (!isValidDate(date)) return "—";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const safeDate = normalizeDateOnly(dateString);

  if (!safeDate) return "—";

  const [year, month, day] = safeDate.split("-");

  return `${day}/${month}/${year}`;
}

function formatOpenTime(sessionDate, startTime) {
  const startDateTime = buildDateTime(sessionDate, startTime);

  if (!isValidDate(startDateTime)) return "—";

  const openTime = new Date(
    startDateTime.getTime() - OPEN_BEFORE_START_MINUTES * 60 * 1000
  );

  return formatOnlyTime(openTime);
}

function formatLateTime(sessionDate, startTime) {
  const startDateTime = buildDateTime(sessionDate, startTime);

  if (!isValidDate(startDateTime)) return "—";

  const lateTime = new Date(
    startDateTime.getTime() + LATE_AFTER_START_MINUTES * 60 * 1000
  );

  return formatOnlyTime(lateTime);
}

function formatCloseTime(sessionDate, endTime) {
  const endDateTime = buildDateTime(sessionDate, endTime);

  if (!isValidDate(endDateTime)) return "—";

  const closeTime = new Date(
    endDateTime.getTime() - CLOSE_BEFORE_END_MINUTES * 60 * 1000
  );

  return formatOnlyTime(closeTime);
}

function formatCheckIn(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (!isValidDate(date)) return "—";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value) {
  const dayMap = {
    MONDAY: "Thứ 2",
    TUESDAY: "Thứ 3",
    WEDNESDAY: "Thứ 4",
    THURSDAY: "Thứ 5",
    FRIDAY: "Thứ 6",
    SATURDAY: "Thứ 7",
    SUNDAY: "Chủ nhật",

    Monday: "Thứ 2",
    Tuesday: "Thứ 3",
    Wednesday: "Thứ 4",
    Thursday: "Thứ 5",
    Friday: "Thứ 6",
    Saturday: "Thứ 7",
    Sunday: "Chủ nhật",

    0: "Chủ nhật",
    1: "Thứ 2",
    2: "Thứ 2",
    3: "Thứ 3",
    4: "Thứ 4",
    5: "Thứ 5",
    6: "Thứ 6",
    7: "Thứ 7",
    8: "Chủ nhật",
  };

  if (value === null || value === undefined || value === "") return "—";

  const key = String(value);

  return dayMap[key] || dayMap[key.toUpperCase()] || value;
}

function translateFaceStatus(status) {
  const statusMap = {
    WAITING_CONFIRM: "Chờ sinh viên bấm OK",
    ATTENDANCE_CONFIRMED: "Đã xác nhận điểm danh",
    ATTENDANCE_SAVED: "Đã lưu điểm danh",
    PRESENT: "Đã điểm danh",
    LATE: "Đi trễ",
    ABSENT: "Vắng",
    COOLDOWN: "Đã điểm danh gần đây",
    LOW_CONFIDENCE: "Độ tin cậy thấp",
    NOT_IN_SESSION: "Không học lớp này",
    STUDENT_NOT_FOUND: "Không tìm thấy sinh viên",
    UNKNOWN: "Không xác định",
  };

  return statusMap[status] || status || "Không xác định";
}