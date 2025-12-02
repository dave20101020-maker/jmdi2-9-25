import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function NavBar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/coach', label: 'Coach', icon: '💬' },
    { path: '/community', label: 'Community', icon: '👥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-[#1a1f35] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-yellow-400">
              ⭐ NorthStar
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-4">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-white/70">
                  {user.full_name || user.username || user.email}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:text-yellow-400 transition-colors text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
