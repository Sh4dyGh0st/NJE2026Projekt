import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="bg-nje text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <img
            src="https://gamf.uni-neumann.hu/wp-content/uploads/2020/11/NJE_GAMF_logo_feher-768x139.png"
            alt="NJE GAMF"
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop navigation links */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="hover:text-blue-200 transition-colors">
            Események
          </Link>
          <Link to="/news" className="hover:text-blue-200 transition-colors">
            Hírek
          </Link>

          {role === 'Admin' && (
            <Link to="/admin" className="hover:text-blue-200 transition-colors font-medium">
              Admin felület
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="hover:text-blue-200 transition-colors">
                Profil
              </Link>
              <button
                onClick={handleLogout}
                className="bg-white text-nje px-3 py-1 rounded font-medium hover:bg-blue-100 transition-colors"
              >
                Kijelentkezés
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-white text-nje px-3 py-1 rounded font-medium hover:bg-blue-100 transition-colors"
            >
              Bejelentkezés
            </Link>
          )}
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5 rounded focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Menü bezárása' : 'Menü megnyitása'}
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-white rounded transition-transform duration-200 ${
              menuOpen ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white rounded transition-opacity duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white rounded transition-transform duration-200 ${
              menuOpen ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-nje border-t border-blue-800 px-4 pb-4 flex flex-col gap-3">
          <Link
            to="/"
            className="py-2 hover:text-blue-200 transition-colors"
            onClick={closeMenu}
          >
            Események
          </Link>
          <Link
            to="/news"
            className="py-2 hover:text-blue-200 transition-colors"
            onClick={closeMenu}
          >
            Hírek
          </Link>

          {role === 'Admin' && (
            <Link
              to="/admin"
              className="py-2 hover:text-blue-200 transition-colors font-medium"
              onClick={closeMenu}
            >
              Admin felület
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="py-2 hover:text-blue-200 transition-colors"
                onClick={closeMenu}
              >
                Profil
              </Link>
              <button
                onClick={handleLogout}
                className="mt-1 bg-white text-nje px-3 py-2 rounded font-medium hover:bg-blue-100 transition-colors text-left min-h-[44px]"
              >
                Kijelentkezés
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="mt-1 bg-white text-nje px-3 py-2 rounded font-medium hover:bg-blue-100 transition-colors inline-block min-h-[44px] flex items-center"
              onClick={closeMenu}
            >
              Bejelentkezés
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
