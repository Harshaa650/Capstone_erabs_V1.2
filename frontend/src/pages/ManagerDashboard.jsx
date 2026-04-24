import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import KPI from '../components/KPI'
import { analytics, bookings } from '../lib/api'
import {
  ClipboardList, CheckCircle2, XCircle, Clock, Users,
  MessageSquare, ChevronRight
} from 'lucide-react'
import { fmtDate, fmtTime } from '../lib/dateUtils'

export default function ManagerDashboard() {
  const [summary, setSummary] = useState(null)
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [s, p] = await Promise.all([
        analytics.summary(),
        bookings.list('pending'),
      ])
      setSummary(s.data)
      setPendingList(p.data)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await bookings.approve(id, comment)
      toast.success('Booking approved')
      setComment('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    if (!comment.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setActionLoading(id)
    try {
      await bookings.reject(id, comment)
      toast.success('Booking rejected')
      setComment('')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel glass-card p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute -right-24 -top-24 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 px-3 py-1 rounded-full text-xs text-brand-300 mb-3">
            <Users size={12} /> Manager Panel
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Approval <span className="text-gradient">Queue</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Review and action pending booking requests from your team. A clean approval flow keeps your spaces conflict-free.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5 text-sm">
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <Clock size={14} /> {pendingList.length} awaiting action
            </span>
            <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} /> {summary?.total_bookings || 0} total bookings
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KPI title="Pending approvals" value={summary?.pending_approvals || 0} icon="pending" delay={0} />
        <KPI title="Total bookings" value={summary?.total_bookings || 0} icon="bookings" delay={100} />
        <KPI title="Active resources" value={summary?.active_resources || 0} icon="resources" delay={200} />
        <KPI title="Departments" value={summary?.by_department?.length || 0} icon="users" delay={300} />
      </div>

      {/* Pending Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList size={20} className="text-brand-400" />
            Pending Requests
            {pendingList.length > 0 && (
              <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingList.length}
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">All caught up!</p>
              <p className="text-gray-600 text-sm mt-1">No pending approval requests.</p>
            </div>
          ) : (
            pendingList.map((bk, i) => (
              <motion.div
                key={bk.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Booking info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                        <Users size={18} className="text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{bk.resource_name}</h3>
                        <p className="text-gray-500 text-sm">by {bk.user_name}</p>
                      </div>
                      <span className="ml-auto bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <Clock size={10} /> pending
                      </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 text-xs">Date</p>
                        <p className="text-gray-300">{fmtDate(bk.start_time)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Time</p>
                        <p className="text-gray-300">
                          {fmtTime(bk.start_time)} — {fmtTime(bk.end_time)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Attendees</p>
                        <p className="text-gray-300">{bk.attendees}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Purpose</p>
                        <p className="text-gray-300 truncate">{bk.purpose || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock size={12} />
                      Requested {fmtDate(bk.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-80 flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                      <MessageSquare size={14} className="text-gray-500" />
                      <input
                        type="text"
                        placeholder="Add a comment (required for reject)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-gray-600"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(bk.id)}
                        disabled={actionLoading === bk.id}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === bk.id ? (
                          <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(bk.id)}
                        disabled={actionLoading === bk.id}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === bk.id ? (
                          <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <>
                            <XCircle size={16} /> Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </Shell>
  )
}
