import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import ThreeBackground from '../components/ThreeBackground'
import CursorGlow from '../components/CursorGlow'
import ImageCarousel from '../components/ImageCarousel'
import {
  Building2, CalendarClock, MonitorSmartphone, BarChart3,
  ChevronDown, Zap, Shield, Globe, ArrowRight, Sparkles,
  CheckCircle2, Users, Clock, Award
} from 'lucide-react'

const featureImages = [
  '/rooms/boardroom.jpg',
  '/rooms/focus-pod.jpg',
  '/rooms/quantum-lab.jpg',
]

const carouselImages = [
  '/rooms/hotdesk.jpg',
  '/rooms/boardroom.jpg',
  '/rooms/quantum-lab.jpg',
  '/rooms/projector.jpg',
]

const statsImages = [
  '/rooms/boardroom.jpg',
  '/rooms/vehicle.jpg',
  '/rooms/hotdesk.jpg',
  '/rooms/projector.jpg',
]

export default function LandingPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('employee')
  const [departmentId, setDepartmentId] = useState('')
  const [managerId, setManagerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [departments, setDepartments] = useState([])
  const [managers, setManagers] = useState([])
  const heroRef = useRef(null)

  useEffect(() => {
    if (showRegister) {
      fetchDepartments()
    }
  }, [showRegister])

  useEffect(() => {
    if (showRegister && departmentId && role === 'employee') {
      fetchManagers(departmentId)
    }
  }, [departmentId, role, showRegister])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      setDepartments(data)
    } catch (error) {
      toast.error('Failed to load departments')
    }
  }

  const fetchManagers = async (deptId) => {
    try {
      const response = await fetch(`/api/managers?department_id=${deptId}`)
      const data = await response.json()
      setManagers(data)
    } catch (error) {
      toast.error('Failed to load managers')
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!email || !password || !name) {
      toast.error('Please fill in all required fields')
      return
    }
    if (role !== 'admin' && !departmentId) {
      toast.error('Please select a department')
      return
    }
    setLoading(true)
    try {
      const payload = {
        email,
        name,
        password,
        role,
        department_id: role === 'admin' ? null : departmentId,
        manager_id: role === 'employee' ? managerId : null,
      }
      
      const response = await fetch('/api/auth/register-with-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Registration failed')
      }
      
      const user = await response.json()
      toast.success(`Account created for ${user.name}! Please log in.`)
      setShowRegister(false)
      setEmail('')
      setPassword('')
      setName('')
      setDepartmentId('')
      setManagerId('')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (email, pw) => {
    setEmail(email)
    setPassword(pw)
  }

  const features = [
    {
      icon: CalendarClock,
      title: 'Instant Room Booking',
      desc: 'Locate and reserve available meeting spaces instantly through an interactive 3D map of your entire office floorplan.',
      images: featureImages,
    },
    {
      icon: MonitorSmartphone,
      title: 'Desk Hotelling',
      desc: 'Enable flexible work arrangements. Employees can claim their perfect workstation before they even step into the building.',
      images: [featureImages[1], featureImages[0], featureImages[2]],
    },
    {
      icon: BarChart3,
      title: 'Utilization Analytics',
      desc: 'Gain deep insights into how your enterprise space is actually used. Optimize layouts and reduce overhead costs effortlessly.',
      images: [featureImages[2], featureImages[1], featureImages[0]],
    },
  ]

  const highlights = [
    { icon: Zap, label: 'Lightning Fast', desc: 'Book in under 10 seconds' },
    { icon: Shield, label: 'Conflict Proof', desc: 'Smart overlap detection' },
    { icon: Globe, label: 'Multi-location', desc: 'Manage all offices' },
    { icon: Users, label: 'Team Sync', desc: 'Department-aware routing' },
  ]

  return (
    <div className="relative min-h-screen bg-ink-800 overflow-x-hidden">
      <ThreeBackground />
      <CursorGlow />

      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-ink-900/90 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="section-padding flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-glow-blue">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">ERABS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-sm text-gray-300 hover:text-white transition-colors">Demo</a>
            <a href="#stats" className="text-sm text-gray-300 hover:text-white transition-colors">Resources</a>
            <button
              onClick={() => document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary text-sm py-2.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="section-padding w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
                <Sparkles size={14} className="text-brand-400" />
                <span className="text-sm text-brand-300 font-medium">New: 3D Workspace Mapping</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-6">
                Enterprise Resource{' '}
                <span className="text-gradient">Allocation</span>
                <br />& Booking System
              </h1>
              <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Transform your physical workspace into a dynamic environment.
                Seamlessly book meeting rooms, desks, and office resources with our intelligent, immersive platform.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-10">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                    <h.icon size={16} className="text-brand-400" />
                    <span className="text-sm text-gray-300">{h.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => document.getElementById('login-section').scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
              >
                Get Started
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Right - Login Form */}
            <div id="login-section" className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-brand-700/20 rounded-2xl blur-2xl" />
              <div className="relative glass-card p-8 lg:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {showRegister ? 'Create Account' : 'Welcome back'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {showRegister ? 'Join your ERAB workspace' : 'Sign in to your ERABS workspace'}
                  </p>
                </div>

                {!showRegister ? (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="employee@erabs.io"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </span>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      >
                        <option value="employee" className="bg-ink-900">Employee</option>
                        <option value="manager" className="bg-ink-900">Manager</option>
                        <option value="admin" className="bg-ink-900">Admin</option>
                      </select>
                    </div>
                    {role !== 'admin' && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Department</label>
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        >
                          <option value="" className="bg-ink-900">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-ink-900">
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {role === 'employee' && departmentId && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Manager (Optional)</label>
                        <select
                          value={managerId}
                          onChange={(e) => setManagerId(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        >
                          <option value="" className="bg-ink-900">Auto-assign (Recommended)</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id} className="bg-ink-900">
                              {manager.name} ({manager.email})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">If not selected, a manager from your department will be auto-assigned</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating Account...
                        </span>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegister(!showRegister)
                      setEmail('')
                      setPassword('')
                      setName('')
                      setDepartmentId('')
                      setManagerId('')
                    }}
                    className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    {showRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                  </button>
                </div>

                {!showRegister && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-4 text-center">Quick login with demo accounts</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Admin', email: 'admin@erabs.io', pw: 'admin123', color: 'from-purple-500/20 to-purple-700/20 border-purple-500/30' },
                        { label: 'Manager', email: 'manager@erabs.io', pw: 'manager123', color: 'from-brand-500/20 to-brand-700/20 border-brand-500/30' },
                        { label: 'Employee', email: 'employee@erabs.io', pw: 'employee123', color: 'from-green-500/20 to-green-700/20 border-green-500/30' },
                      ].map((acc) => (
                        <button
                          key={acc.label}
                          onClick={() => quickLogin(acc.email, acc.pw)}
                          className={`bg-gradient-to-br ${acc.color} border rounded-xl p-3 text-center hover:scale-105 transition-transform`}
                        >
                          <p className="text-xs font-semibold text-white">{acc.label}</p>
                          <p className="text-[10px] text-gray-400 mt-1 truncate">{acc.email}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500">Scroll to explore</span>
          <ChevronDown size={20} className="text-brand-400" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 mb-6">
              <Award size={14} className="text-brand-400" />
              <span className="text-sm text-brand-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Immersive Resource Management
            </h2>
            <p className="text-gray-400 text-lg">
              Experience your office in a whole new dimension. Our platform brings clarity and efficiency to your daily workspace operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="group glass-card overflow-hidden hover-lift"
              >
                <div className="relative h-52 overflow-hidden">
                  <ImageCarousel images={f.images} autoPlayInterval={2500 + i * 300} height="100%" showDots={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-glow-blue">
                    <f.icon size={22} className="text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-brand-400 text-sm font-medium group-hover:gap-3 transition-all">
                    <span>Learn more</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="demo" className="relative py-24 lg:py-32">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 mb-6">
              <BarChart3 size={14} className="text-brand-400" />
              <span className="text-sm text-brand-300">Live Dashboard</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              See Your Space Differently
            </h2>
            <p className="text-gray-400 text-lg">
              ERABS gives you a bird&apos;s-eye view of your entire organization&apos;s resources, making complex allocations remarkably simple.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-brand-700/10 rounded-2xl blur-3xl" />
            <div className="relative glass-card overflow-hidden">
              <ImageCarousel images={carouselImages} autoPlayInterval={3000} height="500px" showDots={true} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating badges */}
              <div className="absolute bottom-6 left-6 glass-card px-4 py-3 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Boardroom A</p>
                  <p className="text-gray-400 text-xs">Successfully booked for 2:00 PM</p>
                </div>
              </div>

              <div className="absolute top-6 right-6 glass-card px-4 py-3 flex items-center gap-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                  <Users size={20} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Team Allocation</p>
                  <p className="text-gray-400 text-xs">Design team assigned to Zone B</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-24 lg:py-32">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Building2, value: '10K+', label: 'Resources Managed', color: 'from-brand-500 to-brand-600' },
              { icon: Users, value: '50K+', label: 'Active Users', color: 'from-purple-500 to-purple-600' },
              { icon: Clock, value: '99.9%', label: 'Uptime SLA', color: 'from-green-500 to-green-600' },
              { icon: CalendarClock, value: '1M+', label: 'Bookings Monthly', color: 'from-amber-500 to-amber-600' },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass-card p-6 text-center hover-lift group"
              >
                <div className={`w-14 h-14 mx-auto mb-4 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Stats carousel */}
          <div className="glass-card overflow-hidden">
            <ImageCarousel images={statsImages} autoPlayInterval={3500} height="280px" showDots={true} />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 lg:py-32">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Teams Worldwide</h2>
            <p className="text-gray-400">See what our customers say about ERABS</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Chen',
                role: 'VP of Operations',
                company: 'TechCorp Inc.',
                quote: 'ERABS transformed how we manage our hybrid workspace. The 3D visualization alone saved us weeks of planning.',
              },
              {
                name: 'Marcus Johnson',
                role: 'Facilities Manager',
                company: 'Global Finance Ltd.',
                quote: 'The conflict detection is incredible. Zero double-bookings since we implemented ERABS across all 12 floors.',
              },
              {
                name: 'Elena Rodriguez',
                role: 'IT Director',
                company: 'InnovateLabs',
                quote: 'Integration was seamless. Our employees adopted it within days. The analytics dashboard is a game-changer.',
              },
            ].map((t, i) => (
              <div key={i} className="glass-card p-8 hover-lift">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Sparkles key={star} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="section-padding max-w-4xl mx-auto text-center">
          <div className="glass-card p-12 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-700/10" />
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Workspace?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of enterprises using ERABS to optimize their resource allocation and boost productivity.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-5"
              >
                Get Started Now
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="section-padding max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">ERABS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2024 ERABS. All rights reserved.</span>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
