import logoDinkes from "@/assets/logo-dinkes.png"
import type { UserAccount, View } from "../types"

interface HeaderProps {
  isAdmin: boolean
  currentView: View
  user?: UserAccount | null
  onNavigate: (view: View) => void
  onLogout: () => void
}

export default function Header({
  isAdmin,
  currentView,
  user,
  onNavigate,
  onLogout,
}: HeaderProps) {
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin_bidang"
        ? "Admin Bidang"
        : "Viewer"
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Logo + App Name */}
          <button
            onClick={() => onNavigate(isAdmin ? "admin" : "public")}
            className="flex items-center gap-3 group"
          >
            <img
              src={logoDinkes}
              alt="Logo Dinas Kesehatan Gunungkidul"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
            />
            <div className="text-left">
              <div className="font-display font-800 text-base sm:text-lg leading-none text-[#185e48] tracking-tight">
                SI-DHAKSI
              </div>
              <div className="text-[10px] sm:text-xs text-[#2b9272] font-medium leading-tight mt-0.5">
                Dinas Kesehatan Kabupaten Gunungkidul
              </div>
            </div>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onNavigate("admin")}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    currentView === "admin"
                      ? "bg-brand-100 text-brand-800"
                      : "text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate("public")}
                  className={`hidden sm:block text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    currentView === "public" || currentView === "detail"
                      ? "bg-brand-100 text-brand-800"
                      : "text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  Katalog Publik
                </button>
                <button
                  onClick={() => onNavigate("account")}
                  className={`block text-sm font-medium px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
                    currentView === "account"
                      ? "bg-brand-100 text-brand-800"
                      : "text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  Akun Saya
                </button>
                {user?.role === "super_admin" && (
                  <button
                    onClick={() => onNavigate("users")}
                    className={`hidden sm:block text-sm font-medium px-2 sm:px-3 py-1.5 rounded-md transition-colors ${
                      currentView === "users"
                        ? "bg-brand-100 text-brand-800"
                        : "text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    Pengguna
                  </button>
                )}
                <span className="hidden sm:flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-brand-200">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                  {roleLabel}
                </span>
                <button
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors border border-red-200"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("public")}
                  className={`hidden sm:block text-sm font-medium px-3 py-1.5 rounded-md transition-colors text-brand-700 hover:bg-brand-50`}
                >
                  Katalog
                </button>
                <button
                  onClick={() => onNavigate("login")}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-[#185e48] text-white px-4 py-2 rounded-lg hover:bg-[#154c3b] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="hidden sm:inline">Masuk</span>
                  <span className="sm:hidden">Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
