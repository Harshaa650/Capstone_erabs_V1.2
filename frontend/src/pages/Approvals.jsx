import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import { bookings } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  ClipboardList, CheckCircle2, XCircle, Clock, MessageSquare
} from 'lucide-react'
import { fmtDate, fmtTime } from '../lib/dateUtils'

export default function Approvals() {
  const { isManager, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [comments, setComments] = useState({})

  useEffect(() => {
    if (!isManager && !isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchPending()
  }, [isManager, isAdmin])

  const fetchPending = async () => {
    try {
      const res = await bookings.list('pending')
      setPendingList(res.data)
    } catch (err) {
      toast.error('Failed to load pending approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await bookings.approve(id, comments[id] || '')
      toast.success('Booking approved')
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(id)
    try {
      await bookings.reject(id, comments[id] || '')
      toast.success('Booking rejected')
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Approvals</h1>
        <p className="text-gray-400">Review and act on pending booking requests.</p>
      </motion.div>

      <div className="space-y-4">
        {pendingList.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No pending approvals!</p>
            <p className="text-gray-600 text-sm mt-1">All booking requests have been processed.</p>
          </div>
        ) : (
          pendingList.map((bk, i) => (
            <motion.div
              key={bk.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <ClipboardList size={20} className="text-brand-400" />
                    <h3 className="text-white font-semibold text-lg">{bk.resource_name}</h3>
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <Clock size={10} /> Pending
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    Requested by <span className="text-white">{bk.user_name}</span> on{' '}
                    {fmtDate(bk.created_at)}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-600 text-xs mb-1">Date</p>
                      <p className="text-gray-300">{fmtDate(bk.start_time)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-600 text-xs mb-1">Start</p>
                      <p className="text-gray-300">{fmtTime(bk.start_time)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-600 text-xs mb-1">End</p>
                      <p className="text-gray-300">{fmtTime(bk.end_time)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-600 text-xs mb-1">Attendees</p>
                      <p className="text-gray-300">{bk.attendees}</p>
                    </div>
                  </div>
                  {bk.purpose && (
                    <p className="text-gray-500 text-sm mt-4 bg-white/5 rounded-lg p-3">
                      Purpose: {bk.purpose}
                    </p>
                  )}
                </div>

                <div className="lg:w-72 flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2.5 border border-white/10">
                    <MessageSquare size={14} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="Add comment..."
                      value={comments[bk.id] || ''}
                      onChange={(e) => setComments({ ...comments, [bk.id]: e.target.value })}
                      className="bg-transparent text-white text-sm flex-1 focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <button
                    onClick={() => handleApprove(bk.id)}
                    disabled={actionLoading === bk.id}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(bk.id)}
                    disabled={actionLoading === bk.id}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Shell>
  )
}
