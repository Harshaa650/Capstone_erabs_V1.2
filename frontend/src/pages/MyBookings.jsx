import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import { bookings } from '../lib/api'
import { fmtDate, fmtTime } from '../lib/dateUtils'
import {
  CalendarDays, Building2, Clock, XCircle, CheckCircle2,
  AlertCircle, ChevronRight
} from 'lucide-react'

export default function MyBookings() {
  const navigate = useNavigate()
  const [bookingList, setBookingList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()

    const refreshBookings = () => {
      fetchBookings()
    }

    window.addEventListener('erabs-booking-created', refreshBookings)
    return () => window.removeEventListener('erabs-booking-created', refreshBookings)
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await bookings.list('mine')
      setBookingList(res.data)
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    try {
      await bookings.cancel(id)
      toast.success('Booking cancelled')
      fetchBookings()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel')
    }
  }

  const statusConfig = {
    approved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
    completed: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  }

  const grouped = bookingList.reduce((acc, bk) => {
    const status = bk.status
    if (!acc[status]) acc[status] = []
    acc[status].push(bk)
    return acc
  }, {})

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
        <p className="text-gray-400">Track and manage all your resource bookings.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const count = grouped[status]?.length || 0
          const Icon = cfg.icon
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${cfg.bg} border ${cfg.border} rounded-xl p-4 text-center`}
            >
              <Icon size={20} className={`${cfg.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className={`text-xs ${cfg.color} capitalize`}>{status}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookingList.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <CalendarDays size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No bookings yet.</p>
            <button
              onClick={() => navigate('/resources')}
              className="mt-4 btn-primary"
            >
              Browse Resources
            </button>
          </div>
        ) : (
          bookingList.map((bk, i) => {
            const cfg = statusConfig[bk.status] || statusConfig.pending
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={bk.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-5 hover:bg-white/[0.07] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={22} className="text-brand-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-semibold">{bk.resource_name}</h3>
                        <span className={`${cfg.bg} ${cfg.color} ${cfg.border} px-2.5 py-0.5 rounded-full text-xs font-medium capitalize flex items-center gap-1`}>
                          <StatusIcon size={10} />
                          {bk.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">
                        {fmtDate(bk.start_time)}
                        {' · '}
                        {fmtTime(bk.start_time)} — {fmtTime(bk.end_time)}
                        <span className="ml-1.5 text-[10px] text-brand-400/70 font-medium">IST</span>
                      </p>
                      {bk.purpose && (
                        <p className="text-gray-600 text-xs mt-1">Purpose: {bk.purpose}</p>
                      )}
                      {bk.approver_comment && (
                        <p className="text-gray-600 text-xs mt-1">Note: {bk.approver_comment}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 lg:ml-auto">
                    {bk.attendees > 1 && (
                      <span className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded-lg">
                        {bk.attendees} attendees
                      </span>
                    )}
                    {['pending', 'approved'].includes(bk.status) && (
                      <button
                        onClick={() => handleCancel(bk.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg transition-colors border border-red-500/20"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </Shell>
  )
}
