import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const dropdownRef = useRef(null);

  const isActive = (path) =>
    location.pathname === path
      ? "relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white after:rounded-full font-semibold text-white"
      : "text-gray-300";

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.avatar_url) {
            setAvatarUrl(`${data.avatar_url}?t=${Date.now()}`);
          }
        });
      setDropdownOpen(false);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black text-white shadow z-50 h-20 px-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold">
        PhilCrypto
      </Link>

      <div className="hidden md:flex items-center gap-6 relative">
        {user && (
          <>
            <Link to="/" className={isActive("/")}>
              {"Ana Sayfa"}
            </Link>
            <Link to="/portfolio" className={isActive("/portfolio")}>
              {"Portfolyo"}
            </Link>
          </>
        )}

        {user ? (
          <div ref={dropdownRef} className="relative">
            <button onClick={() => setDropdownOpen((prev) => !prev)}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border border-gray-600 object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-500 rounded-full" />
              )}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded shadow-lg">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-800"
                >
                  {"Profil"}
                </Link>
                <Link
                  to="/profile/password"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-800"
                >
                  {"Şifre Değiştir"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-800"
                >
                  {"Çıkış Yap"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white">
              {"Giriş Yap"}
            </Link>
            <Link to="/signup" className="text-gray-300 hover:text-white">
              {"Kayıt Ol"}
            </Link>
          </>
        )}
      </div>

      <div className="md:hidden">
        <button onClick={() => setMenuOpen(true)} className="w-8 h-8">
          <div className="h-0.5 w-full bg-white mb-1" />
          <div className="h-0.5 w-full bg-white mb-1" />
          <div className="h-0.5 w-full bg-white" />
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-lg font-medium animate-fade-slide">
          <style>
            {`@keyframes fadeSlide { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }`}
          </style>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-6 right-6 text-3xl text-white"
          >
            &times;
          </button>

          <div className="flex flex-col gap-6 text-white text-center mt-10">
            {user ? (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>
                  {"Anasayfa"}
                </Link>
                <Link to="/portfolio" onClick={() => setMenuOpen(false)}>
                  {"Portfolyo"}
                </Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  {"Profil"}
                </Link>
                <Link to="/profile/password" onClick={() => setMenuOpen(false)}>
                  {"Şifre Değiştir"}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                >
                  {"Çıkış Yap"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  {"Giriş Yap"}
                </Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  {"Kayıt Ol"}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
