// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3060/api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/accounts/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        return;
      }

      // Lưu user vào localStorage theo style project
      localStorage.setItem("user", JSON.stringify(data.user));

      // Điều hướng theo role
      const role = data.user.role;
      if (role === "STUDENT") {
        navigate("/student/dashboard");
      } else if (role === "TEACHER") {
        navigate("/dashboard"); // Nếu có Teacher portal
      } else if (role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Không thể kết nối đến server. Hãy kiểm tra backend đang chạy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center relative overflow-hidden font-[Inter]">
      
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #004ac6 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      {/* Background Image */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1OfXR9JTT9BVeM4wGLpTr-hwRQE3eKEqMJ8QDBlICI3_mdXR1yrtwD0d1Ia6UMfV1t-Y3myEgJl9j-ddhJ8rzsIeIwpRjfEcNovWgx4fN_mtb0Iu3iLCGMkVuaXhWjcxjcjsvf_3EfWU6mnxGX3b3JBHMUlATJq7SYUXQJgC6pLar6eh-yumm3Up2fShJ1KjmnnzgGC7Q0ZnjDw01Koq1vo3V9AizWDLvRxuTahiuX4oEF8FViV28Q9BEz9VBYG8HcZavusA2_g"
          alt="Background"
          className="w-full h-full object-cover opacity-10 mix-blend-multiply"
        />
      </div>

      {/* Login Container */}
      <main className="w-full max-w-md mx-auto z-10 px-4 md:px-0">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 relative overflow-hidden shadow-lg shadow-blue-300/30 ring-1 ring-blue-300">
            
            <span className="material-symbols-outlined text-blue-700 text-4xl z-10">
              face
            </span>

            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-200"></div>

            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-400"></div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900">
            EduFace AI
          </h1>

          <p className="text-gray-500 mt-2">
            Biometric Authentication System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-8 shadow-2xl shadow-blue-100">
          
          <form className="space-y-6" onSubmit={handleLogin}>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên đăng nhập
              </label>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  person
                </span>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Mật khẩu
                </label>
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  lock
                </span>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Button */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-b from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-300/40 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Biometric Button */}
          <div className="mt-6">
            <button
              type="button"
              className="w-full py-3 px-4 bg-gray-100 text-gray-800 font-semibold rounded-xl border border-gray-200 hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-blue-600">
                badge
              </span>

              <span>Use Biometric Kiosk</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500 max-w-xs mx-auto">
          By logging in, you agree to the University's Acceptable Use Policy and
          Biometric Data Processing terms.
        </p>
      </main>
    </div>
  );
}
