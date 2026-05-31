// // export default function QuickActions() {
// //   return (
// //     <div className="bg-white rounded-2xl p-6 shadow-sm border">
// //       <h3 className="text-xl font-semibold mb-4">Thao tác nhanh</h3>

// //       <div className="grid grid-cols-2 gap-3">
// //         <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2">
// //           <span className="material-symbols-outlined text-blue-600">
// //             person_add
// //           </span>
// //           <span className="text-sm font-semibold text-center">
// //             Thêm học sinh
// //           </span>
// //         </button>

// //         <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2">
// //           <span className="material-symbols-outlined text-gray-600">
// //             camera_alt
// //           </span>
// //           <span className="text-sm font-semibold text-center">
// //             Cập nhật FaceID
// //           </span>
// //         </button>

// //         <button className="col-span-2 flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2">
// //           <span className="material-symbols-outlined text-orange-600">
// //             problem
// //           </span>
// //           <span className="text-sm font-semibold text-center">
// //             Xử lý báo lỗi nhận diện
// //           </span>
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }
// import { useNavigate } from "react-router-dom";

// export default function QuickActions() {
//   const navigate = useNavigate();

//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm border">
//       <h3 className="text-xl font-semibold mb-4">Thao tác nhanh</h3>

//       <div className="grid grid-cols-2 gap-3">
//         {/* Nút thêm học sinh */}
//         <button
//           onClick={() => navigate("/addstudent")}
//           className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
//         >
//           <span className="material-symbols-outlined text-blue-600">
//             person_add
//           </span>

//           <span className="text-sm font-semibold text-center">
//             Thêm học sinh
//           </span>
//         </button>

//         {/* Nút cập nhật FaceID */}
//         <button
//           onClick={() => navigate("/face-data")}
//           className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
//         >
//           <span className="material-symbols-outlined text-gray-600">
//             camera_alt
//           </span>

//           <span className="text-sm font-semibold text-center">
//             Cập nhật FaceID
//           </span>
//         </button>

//         {/* Nút xử lý lỗi nhận diện */}
//         <button
//           onClick={() => navigate("/recognition-history")}
//           className="col-span-2 flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
//         >
//           <span className="material-symbols-outlined text-orange-600">
//             problem
//           </span>

//           <span className="text-sm font-semibold text-center">
//             Xử lý báo lỗi nhận diện
//           </span>
//         </button>
//       </div>
//     </div>
//   );
// }
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <h3 className="text-xl font-semibold mb-4">Thao tác nhanh</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Chuyển sang trang thêm học sinh */}
        <button
          onClick={() => navigate("/addstudent")}
          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
        >
          <span className="material-symbols-outlined text-blue-600">
            person_add
          </span>

          <span className="text-sm font-semibold text-center">
            Thêm học sinh
          </span>
        </button>

        {/* Chuyển sang trang danh sách học sinh để cập nhật FaceID */}
        <button
          // onClick={() => navigate("/students")}
          className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
        >
          <span className="material-symbols-outlined text-gray-600">
            camera_alt
          </span>

          <span className="text-sm font-semibold text-center">
            Cập nhật FaceID
          </span>
        </button>

        {/* Hiện tại chưa có route xử lý lỗi nhận diện, tạm chuyển sang dashboard hoặc students */}
        <button
          // onClick={() => navigate("/students")}
          className="col-span-2 flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border gap-2 transition"
        >
          <span className="material-symbols-outlined text-orange-600">
            problem
          </span>

          <span className="text-sm font-semibold text-center">
            Xử lý báo lỗi nhận diện
          </span>
        </button>
      </div>
    </div>
  );
}