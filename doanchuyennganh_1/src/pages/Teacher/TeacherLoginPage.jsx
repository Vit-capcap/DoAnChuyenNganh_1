export default function TeacherLoginPage() {
    return (
      <div className="bg-[#faf8ff] min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans text-[#191b23]">
        
        {/* Background Blur Effects */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-300/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[80px]" />
  
        {/* Main Container */}
        <main className="w-[90%] max-w-[1200px] bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row overflow-hidden relative z-10 min-h-[700px]">
  
          {/* Left Section */}
          <section className="hidden md:flex md:w-1/2 relative bg-[#f3f3fe]/50 p-12 flex-col justify-between overflow-hidden border-r border-white/20">
  
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
  
            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <span className="material-symbols-outlined fill">
                  shield_person
                </span>
              </div>
  
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 tracking-tight">
                EduGuardian AI
              </h1>
            </div>
  
            {/* Illustration */}
            <div className="relative z-10 w-full flex-1 flex items-center justify-center mt-12 mb-8">
              <div className="relative w-full max-w-[400px] aspect-square rounded-[24px] overflow-hidden border border-white/30 shadow-xl shadow-blue-500/10">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_MCh-4Fpp0YOIIqq87FhVcQdV7iooKzy65ONEHjW0ggY6DoY2uRGjVGn2X9pLhO74QSGU2KFEABrIUzvWLV8SdjXyBIFBFlaxrKZ0TgOChXZtcGjhYeGCoGPSJ3A7HiFtW3ANd70duMkvXiyQUBiurWJBREVAQXtL6WUor7GLxOq3rsw2oihvpYQgO9pHHN17aI7lPiSZMkuWyX1rfND86QeEY2pVgdqOzfiipNNF6cuAN0wA_wP7Z9HMH4GBqBeC4E2RgYNwRNYJ"
                  alt="AI Facial Recognition"
                  className="w-full h-full object-cover"
                />
  
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent mix-blend-overlay" />
              </div>
            </div>
  
            {/* Tagline */}
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-[#191b23] mb-2">
                Invisible Proctoring.
              </h2>
  
              <p className="text-lg text-[#565e74] max-w-sm leading-relaxed">
                Ensuring academic integrity through cutting-edge biometric
                analysis and ambient monitoring.
              </p>
            </div>
          </section>
  
          {/* Right Section */}
          <section className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-white relative">
  
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-3 mb-12">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px] fill">
                  shield_person
                </span>
              </div>
  
              <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                EduGuardian
              </h1>
            </div>
  
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-[#191b23] mb-3">
                Welcome Back
              </h2>
  
              <p className="text-[#565e74] text-base leading-relaxed">
                Sign in to access your proctoring dashboard and manage your
                classes.
              </p>
            </div>
  
            {/* Form */}
            <form className="space-y-6">
  
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-widest text-[#565e74]"
                >
                  Email Address
                </label>
  
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#565e74]">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
  
                  <input
                    type="email"
                    id="email"
                    placeholder="teacher@institution.edu"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#c3c6d7] rounded-xl text-[#191b23] placeholder:text-[#737686] focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                  />
                </div>
              </div>
  
              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-widest text-[#565e74]"
                >
                  Password
                </label>
  
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#565e74]">
                    <span className="material-symbols-outlined">lock</span>
                  </div>
  
                  <input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#c3c6d7] rounded-xl text-[#191b23] placeholder:text-[#737686] focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                  />
                </div>
              </div>
  
              {/* Utilities */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-[#c3c6d7] text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
  
                  <label
                    htmlFor="remember"
                    className="text-[#565e74] cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
  
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
  
              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Sign In to Dashboard
  
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
  
            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-sm text-[#565e74]">
                Need help accessing your account?{" "}
                <a
                  href="#"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Contact IT Support
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }