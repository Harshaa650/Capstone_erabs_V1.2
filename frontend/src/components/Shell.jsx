import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, CalendarDays, Building2, ClipboardList,
  Settings, LogOut, Menu, X, Shield, Users, ChevronLeft,
  Activity, Sparkles,
} from 'lucide-react'

export default function Shell({ children }) {
  const { user, logout, isAdmin, isManager } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', show: true },
    { icon: Building2, label: 'Resources', path: '/resources', show: true },
    { icon: CalendarDays, label: 'My Bookings', path: '/bookings', show: true },
    { icon: Activity, label: 'Analytics', path: '/analytics', show: true },
    { icon: Sparkles, label: 'AI Assistant', path: '/assistant', show: true },
    { icon: ClipboardList, label: 'Approvals', path: '/approvals', show: isManager || isAdmin },
    { icon: Shield, label: 'Admin Panel', path: '/admin', show: isAdmin },
    { icon: Users, label: 'Manager Panel', path: '/manager', show: isManager && !isAdmin },
    { icon: Settings, label: 'Settings', path: '/settings', show: true },
  ]

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-ink-800 flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        data-testid="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-ink-700/90 backdrop-blur rounded-lg flex items-center justify-center text-white border border-white/10"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* STICKY Sidebar — doesn't scroll with main content */}
      <aside
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-40 w-72 bg-ink-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen flex-shrink-0 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow-blue">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">ERABS</h1>
              <p className="text-xs text-brand-200">Resource OS</p>
            </div>
          </div>
        </div>

        {/* Navigation — this can scroll internally if it overflows */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin min-h-0">
          {navItems.filter((i) => i.show).map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                data-testid={`nav-${item.path.replace('/', '') || 'dashboard'}`}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-glow-blue'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 bg-brand-400 rounded-full" />}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          <div className="bg-white/5 rounded-xl p-4 mb-3">
            <p className="text-white font-semibold text-sm">{user?.name || 'User'}</p>
            <p className="text-gray-400 text-xs">{user?.role} · {user?.department}</p>
          </div>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — scrolls independently */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen scrollbar-thin">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-ink-800/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden ml-12">
            <span className="text-white font-semibold">ERABS</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
            <button onClick={() => navigate(-1)} className="hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span>/</span>
            <span className="text-white capitalize">{location.pathname.slice(1) || 'dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
