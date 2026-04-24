import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Area, AreaChart,
} from 'recharts'
import Shell from '../components/Shell'
import api from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  TrendingUp, Clock, AlertTriangle, Activity, Sparkles,
  ChevronsUp, Zap,
} from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function heatColor(v, max) {
  if (max === 0) return 'rgba(255,255,255,0.03)'
  const t = v / max
  const hue = 220 - 180 * t  // brand-blue → magenta
  return `hsla(${hue}, 80%, 55%, ${0.15 + 0.8 * t})`
}

export default function Analytics() {
  const { isAdmin, isManager } = useAuth()
  const canSeeAll = isAdmin || isManager
  const [scope, setScope] = useState(canSeeAll ? 'all' : 'mine')
  const [days, setDays] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await api.get('/analytics/utilization', { params: { scope, days } })
        setData(res.data)
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    })()
  }, [scope, days])

  if (loading || !data) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </Shell>
    )
  }

  const heatMax = Math.max(1, ...data.heatmap.flat())

  return (
    <Shell>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel glass-card p-8 mb-6 relative overflow-hidden"
      >
        <div className="absolute -right-24 -top-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs text-purple-300 mb-3">
              <Activity size={12} /> Utilization Analytics
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Workspace <span className="text-gradient">Intelligence</span>
            </h1>
            <p className="text-gray-400 max-w-xl">
              Peak hours, idle resources, cost-of-unused-assets — everything you need to optimise your workplace.
            </p>
          </div>

          {/* Scope & window selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {canSeeAll && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                {['mine', 'all'].map((s) => (
                  <button
                    key={s}
                    data-testid={`scope-${s}`}
                    onClick={() => setScope(s)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      scope === s ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s === 'mine' ? 'My data' : 'Org-wide'}
                  </button>
                ))}
              </div>
            )}
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-500"
            >
              <option value={7} className="bg-ink-800">Last 7 days</option>
              <option value={14} className="bg-ink-800">Last 14 days</option>
              <option value={30} className="bg-ink-800">Last 30 days</option>
              <option value={60} className="bg-ink-800">Last 60 days</option>
              <option value={90} className="bg-ink-800">Last 90 days</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp} color="brand"
          label="Total bookings"
          value={data.total_bookings}
          sub={`in last ${data.days} days`}
        />
        <StatCard
          icon={Clock} color="purple"
          label="Hours used"
          value={`${data.total_hours_used}h`}
          sub="room-time booked"
        />
        <StatCard
          icon={ChevronsUp} color="green"
          label="Peak hour"
          value={data.peak_hour?.hour || '—'}
          sub={data.peak_hour ? `${data.peak_hour.count} bookings` : 'no data'}
        />
      </div>

      {/* Peak hours bar chart */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap size={16} className="text-brand-400" /> Peak hours
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Booking count per hour of the day.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.peak_hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e3a5f', borderRadius: 12, color: '#fff' }}
              />
              <Bar dataKey="count" fill="url(#peakGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6fa8ff" />
                  <stop offset="100%" stopColor="#0b69ff" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={16} className="text-purple-400" /> Bookings by day of week
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.by_day_of_week}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e3a5f', borderRadius: 12, color: '#fff' }} />
              <defs>
                <linearGradient id="dowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="count" stroke="#c084fc" fill="url(#dowGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap + idle resources */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <div className="glass-card p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold text-white mb-1">Demand heatmap</h3>
          <p className="text-xs text-gray-500 mb-4">Day × hour intensity. Brighter = more bookings.</p>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-[11px] text-gray-300">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-gray-500">Day</th>
                  {Array.from({ length: 13 }, (_, i) => (
                    <th key={i} className="pb-2 font-normal text-gray-500">{String(8 + i).padStart(2, '0')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d, di) => (
                  <tr key={d}>
                    <td className="pr-2 text-gray-400 font-medium">{d}</td>
                    {data.heatmap[di].map((v, hi) => (
                      <td key={hi} className="p-0.5">
                        <div
                          className="w-full h-6 rounded-sm flex items-center justify-center transition-transform hover:scale-110"
                          style={{ background: heatColor(v, heatMax) }}
                          title={`${d} ${String(8 + hi).padStart(2, '0')}:00 — ${v} bookings`}
                        >
                          {v > 0 && <span className="text-white/90 text-[10px] font-medium">{v}</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Idle resources */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" /> Idle resources
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Less than 15% utilised — ranked by estimated unused cost.
          </p>
          {data.idle_resources.length === 0 ? (
            <p className="text-sm text-green-400">✓ All resources are healthily utilised.</p>
          ) : (
            <div className="space-y-2">
              {data.idle_resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5 hover:border-amber-500/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate">{r.name}</p>
                    <p className="text-[11px] text-gray-500">{r.type} · {r.scene_type} · {r.utilization_pct}% used</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 text-sm font-semibold">{r.idle_hours}h idle</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All resources utilization */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Per-resource utilization</h3>
        <p className="text-xs text-gray-500 mb-4">
          Utilization percentage across the selected window (max 12 bookable hours per day).
        </p>
        <div className="space-y-2">
          {data.per_resource.slice(0, 15).map((r) => (
            <div key={r.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-white font-medium">{r.name}</span>
                  <span className="text-[11px] text-gray-500 ml-2">· {r.type} · {r.bookings} bookings · {r.hours_used}h</span>
                </div>
                <span className="text-sm font-bold" style={{
                  color: r.utilization_pct > 50 ? '#5ee77b'
                    : r.utilization_pct > 25 ? '#6fa8ff'
                    : r.utilization_pct > 10 ? '#f59e0b'
                    : '#ef4444',
                }}>
                  {r.utilization_pct}%
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, r.utilization_pct)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      r.utilization_pct > 50 ? 'linear-gradient(90deg, #5ee77b, #10b981)'
                      : r.utilization_pct > 25 ? 'linear-gradient(90deg, #6fa8ff, #0b69ff)'
                      : r.utilization_pct > 10 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                      : 'linear-gradient(90deg, #fb7185, #ef4444)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: { bg: 'from-brand-500/20 to-brand-700/10', icon: 'bg-brand-500/30 text-brand-300', text: 'text-brand-300' },
    purple: { bg: 'from-purple-500/20 to-purple-700/10', icon: 'bg-purple-500/30 text-purple-300', text: 'text-purple-300' },
    green: { bg: 'from-green-500/20 to-green-700/10', icon: 'bg-green-500/30 text-green-300', text: 'text-green-300' },
    amber: { bg: 'from-amber-500/20 to-amber-700/10', icon: 'bg-amber-500/30 text-amber-300', text: 'text-amber-300' },
  }[color]
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`glass-card p-5 bg-gradient-to-br ${colors.bg} relative overflow-hidden`}
    >
      <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  )
}
