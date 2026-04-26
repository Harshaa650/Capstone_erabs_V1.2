import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import { resources as resourcesApi, bookings } from '../lib/api'
import { getGalleryFor } from './Resources'
import { findFallbackResource } from '../lib/fallbackResources'
import {
  Building2, Users, Clock, ArrowLeft, ChevronLeft, ChevronRight,
  Projector, Volume2, Monitor, Wifi, Car, Armchair, CalendarDays,
  CheckCircle2, Sparkles, Maximize2,
} from 'lucide-react'

const AMENITY_MAP = {
  wifi: { icon: Wifi, label: 'High-speed WiFi' },
  display: { icon: Monitor, label: '4K Display' },
  sound: { icon: Volume2, label: 'Sound System' },
  projector: { icon: Projector, label: 'Projector' },
  chairs: { icon: Armchair, label: 'Ergonomic Chairs' },
  parking: { icon: Car, label: 'Parking Available' },
}

// Business hours — fixed 08:00 to 20:00
const BIZ_START = '08:00'
const BIZ_END = '20:00'

// IST offset string for building timezone-aware ISO strings
const IST_OFFSET = '+05:30'

/**
 * Build an IST-aware ISO string so Supabase stores the correct wall-clock time.
 * e.g. date="2026-04-23", time="10:00" → "2026-04-23T10:00:00+05:30"
 */
function toISTISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00${IST_OFFSET}`
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

/** Today's date in YYYY-MM-DD using the browser's local clock (IST for IST users). */
function toLocalDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Current time as HH:MM using the browser's local clock. */
function toLocalTimeInputValue(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function toLocalDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

/**
 * Format a UTC/ISO datetime string for display in IST.
 * Supabase returns UTC strings; we convert to IST for display.
 */
function formatIST(isoStr, opts = {}) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...opts,
  })
}

function formatISTDate(isoStr) {
  return formatIST(isoStr, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatISTTime(isoStr) {
  return formatIST(isoStr, { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function RoomDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [bookForm, setBookForm] = useState({
    date: '', start: '', end: '', purpose: '', attendees: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [timeConflictState, setTimeConflictState] = useState(null)
  const [sceneFullscreen, setSceneFullscreen] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const r = await resourcesApi.get(id)
        setResource(r.data)
      } catch {
        const fallback = findFallbackResource(id)
        if (fallback) {
          setResource(fallback)
        } else {
          toast.error('Resource not found')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  useEffect(() => {
    if (!id || !bookForm.date || !bookForm.start || !bookForm.end) {
      setTimeConflictState(null)
      return
    }

    const startDateTime = toLocalDateTime(bookForm.date, bookForm.start)
    const endDateTime = toLocalDateTime(bookForm.date, bookForm.end)
    if (startDateTime >= endDateTime) {
      setTimeConflictState(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const attendeesCount = Math.max(1, Number(bookForm.attendees) || 1)
        const { data } = await bookings.validate({
          resource_id: id,
          start_time: toISTISO(bookForm.date, bookForm.start),
          end_time: toISTISO(bookForm.date, bookForm.end),
          attendees: attendeesCount,
          purpose: bookForm.purpose || '',
        })

        if (data?.ok) {
          setTimeConflictState(null)
          return
        }

        const reason = String(data?.reason || '').toLowerCase()
        if (reason.includes('booking rejected')) {
          setTimeConflictState('meeting')
        } else if (reason.includes('buffer time')) {
          setTimeConflictState('buffer')
        } else {
          setTimeConflictState(null)
        }
      } catch {
        setTimeConflictState(null)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [id, bookForm.date, bookForm.start, bookForm.end, bookForm.attendees, bookForm.purpose])

  const handleBook = async () => {
    if (!bookForm.date || !bookForm.start || !bookForm.end) {
      toast.error('Please pick a date and start/end time')
      return
    }

    const todayDate = toLocalDateInputValue()
    const startDateTime = toLocalDateTime(bookForm.date, bookForm.start)
    const endDateTime = toLocalDateTime(bookForm.date, bookForm.end)
    const currentMinute = new Date()
    currentMinute.setSeconds(0, 0)

    if (bookForm.date < todayDate) {
      toast.error('Cannot book dates in the past')
      return
    }

    if (startDateTime < currentMinute) {
      toast.error('Start time cannot be in the past')
      return
    }

    if (startDateTime >= endDateTime) {
      toast.error('Start time must be before end time')
      return
    }

    if (bookForm.start < BIZ_START || bookForm.end > BIZ_END) {
      toast.error(`Bookings are only available between ${BIZ_START} and ${BIZ_END}`)
      return
    }

    const attendeesCount = Number(bookForm.attendees)
    if (!Number.isFinite(attendeesCount) || attendeesCount < 1) {
      toast.error('Please enter at least 1 attendee')
      return
    }

    setBookingLoading(true)
    try {
      const payload = {
        resource_id: id,
        start_time: toISTISO(bookForm.date, bookForm.start),
        end_time: toISTISO(bookForm.date, bookForm.end),
        purpose: bookForm.purpose,
        attendees: attendeesCount,
      }
      await bookings.create(payload)
      toast.success('Booking created successfully!')
      setBookForm({ date: '', start: '', end: '', purpose: '', attendees: '' })
    } catch (err) {
      const detail = String(err?.response?.data?.detail || '').toLowerCase()
      if (detail.includes('buffer time')) {
        toast.error('This slot is in buffer time. Please try booking after 5 minutes.')
      } else if (detail.includes('booking rejected') || detail.includes('already booked') || detail.includes('capacity exceeded')) {
        toast.error('Booking rejected')
      } else {
        toast.error(err.response?.data?.detail || 'Booking failed')
      }
    } finally {
      setBookingLoading(false)
    }
  }

  const gallery = resource ? getGalleryFor(resource) : []
  const nextImage = () => setGalleryIndex((p) => (p + 1) % gallery.length)
  const prevImage = () => setGalleryIndex((p) => (p - 1 + gallery.length) % gallery.length)

  const amenityFlags = (resource?.amenities || '').split(',').map((s) => s.trim()).filter(Boolean)
  const activeAmenities = amenityFlags.map((k) => AMENITY_MAP[k]).filter(Boolean)

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </Shell>
    )
  }

  if (!resource) {
    return (
      <Shell>
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Resource not found</p>
          <button onClick={() => navigate('/resources')} className="mt-4 btn-primary">
            Back to Resources
          </button>
        </div>
      </Shell>
    )
  }

  const iframeSrc = `/room3d?type=${encodeURIComponent(resource.scene_type || 'normal')}`
  const todayDate = toLocalDateInputValue()

  // Compute min start time: 08:00, or current time if today
  const nowTime = toLocalTimeInputValue()
  const isToday = bookForm.date === todayDate
  const minStartTime = isToday && nowTime > BIZ_START ? nowTime : BIZ_START
  const minEndTime = bookForm.start && bookForm.start > BIZ_START ? bookForm.start : BIZ_START

  const handleDateChange = (date) => {
    setBookForm((prev) => ({ ...prev, date, start: '', end: '' }))
  }

  const handleStartChange = (start) => {
    setBookForm((prev) => ({
      ...prev,
      start,
      end: prev.end && prev.end <= start ? '' : prev.end,
    }))
  }

  const attendeesExceedsCapacity = Number(bookForm.attendees) > Number(resource?.capacity || 0)
  const isMeetingTimeConflict = timeConflictState === 'meeting'

  return (
    <Shell>
      <motion.button
        data-testid="back-to-resources"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/resources')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-3 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Resources
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">{resource.name}</h1>
          <span className="bg-brand-500/20 text-brand-300 px-2.5 py-0.5 rounded-full text-xs capitalize border border-brand-500/30">
            {resource.type}
          </span>
          <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full text-xs capitalize border border-purple-500/30 flex items-center gap-1">
            <Sparkles size={10} /> {resource.scene_type} 3D
          </span>
          {resource.requires_approval && (
            <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-xs border border-amber-500/30">
              Approval Required
            </span>
          )}

        </div>
        <p className="text-gray-400 flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><Building2 size={12} className="text-brand-400" /> {resource.location}</span>
          <span className="flex items-center gap-1"><Users size={12} className="text-brand-400" /> Capacity: {resource.capacity}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-brand-400" /> {resource.avail_start}:00 – {resource.avail_end}:00</span>
        </p>
      </motion.div>

      {/* 60:40 split — full available vertical space */}
      <div
        className="grid grid-cols-1 lg:grid-cols-5 gap-4"
        style={{ height: 'calc(100vh - 160px)', minHeight: 780 }}
      >
        {/* LEFT 60% */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 flex flex-col gap-3 min-h-0"
        >
          <div className="flex-[5] glass-card overflow-hidden relative min-h-0">
            <div className="absolute top-3 left-3 z-10 bg-ink-900/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
              <Sparkles size={12} /> 3D Viewer — drag to rotate · scroll to zoom
            </div>
            <button
              data-testid="fullscreen-3d"
              onClick={() => setSceneFullscreen(true)}
              className="absolute top-3 right-3 z-10 bg-ink-900/80 backdrop-blur p-2 rounded-lg text-brand-300 border border-brand-500/30 hover:bg-brand-500/20 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
            <iframe
              data-testid="room-3d-iframe"
              src={iframeSrc}
              title={`${resource.name} 3D viewer`}
              className="w-full h-full border-0"
              style={{ background: '#06090f' }}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Swipe gallery — larger, fills available space */}
          <div className="flex-[2] glass-card overflow-hidden relative min-h-0">
            <div className="absolute top-2 left-3 z-10 bg-ink-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] text-brand-300 border border-brand-500/30">
              Gallery · {galleryIndex + 1}/{gallery.length}
            </div>
            <div
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
            >
              {gallery.map((img, i) => (
                <div key={i} className="min-w-full h-full flex-shrink-0 bg-ink-900">
                  <img src={img} alt={`${resource.name} angle ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {gallery.length > 1 && (
              <>
                <button
                  data-testid="gallery-prev"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-brand-500 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  data-testid="gallery-next"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-brand-500 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === galleryIndex ? 'bg-brand-500 w-7' : 'bg-white/40 w-1.5 hover:bg-white'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* RIGHT 40% — 70:30 (description / booking) — booking area taller for bigger calendar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 flex flex-col gap-3 min-h-0"
        >
          {/* TOP — description + amenities + policies */}
          <div className="flex-[5] glass-card overflow-y-auto scrollbar-thin p-6 min-h-0">
            <h2 className="text-xl font-bold text-white mb-3">About this space</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {resource.description}
            </p>

            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-3">
              Amenities & configuration
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {activeAmenities.length === 0 ? (
                <p className="text-gray-500 text-xs col-span-2">No amenities listed.</p>
              ) : (
                activeAmenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
                    <a.icon size={14} className="text-brand-400" />
                    <span className="text-xs text-brand-200 flex-1">{a.label}</span>
                    <CheckCircle2 size={12} className="text-green-400" />
                  </div>
                ))
              )}
            </div>

            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-3">
              Booking policies
            </h3>
            <div className="space-y-0">
              <PolicyRow label="Maximum duration" value={`${resource.max_duration_min} minutes`} />
              <PolicyRow label="Department restriction" value={resource.department_restricted || 'None'} />
              <PolicyRow
                label="Approval required"
                value={resource.requires_approval ? 'Yes' : 'No'}
                valueClass={resource.requires_approval ? 'text-amber-400' : 'text-green-400'}
              />
              <PolicyRow
                label="Availability"
                valueEl={
                  <span className="text-green-400 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Active
                  </span>
                }
              />
            </div>
          </div>

          {/* BOTTOM — booking panel, scrollable so button is always reachable */}
          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="flex-[4] glass-card p-5 relative overflow-y-auto scrollbar-thin bg-gradient-to-br from-brand-500/10 via-transparent to-purple-500/10 min-h-[320px]"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 relative">
              <CalendarDays size={18} className="text-brand-400" />
              Book this {resource.type}
            </h3>
            <div className="space-y-3 relative">
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Date</label>
                <input
                  data-testid="book-date"
                  type="date"
                  value={bookForm.date}
                  min={todayDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark] transition-all hover:border-brand-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Start</label>
                  <input
                    data-testid="book-start"
                    type="time"
                    value={bookForm.start}
                    min={minStartTime}
                    max="19:59"
                    onChange={(e) => handleStartChange(e.target.value)}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 [color-scheme:dark] transition-all ${
                      isMeetingTimeConflict
                        ? 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 text-white focus:border-brand-500 focus:ring-brand-500/20 hover:border-brand-500/50'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">End</label>
                  <input
                    data-testid="book-end"
                    type="time"
                    value={bookForm.end}
                    min={minEndTime}
                    max={BIZ_END}
                    onChange={(e) => setBookForm({ ...bookForm, end: e.target.value })}
                    className={`w-full bg-white/5 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 [color-scheme:dark] transition-all ${
                      isMeetingTimeConflict
                        ? 'border-red-500 text-red-400 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/10 text-white focus:border-brand-500 focus:ring-brand-500/20 hover:border-brand-500/50'
                    }`}
                  />
                </div>
              </div>
              {isMeetingTimeConflict && (
                <p className="text-[10px] text-red-400 -mt-1">Booking rejected: this room is already occupied during this time.</p>
              )}
              <p className="text-[10px] text-gray-500 -mt-1">Available hours: 08:00 AM – 08:00 PM</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Attendees</label>
                  <input
                    data-testid="book-attendees"
                    type="number"
                    min="1"
                    max={resource.capacity}
                    value={bookForm.attendees}
                    onChange={(e) => setBookForm({ ...bookForm, attendees: e.target.value })}
                    placeholder="#"
                    title={`Attendees (max ${resource.capacity})`}
                    className={`w-full bg-white/5 border rounded-lg px-2.5 py-2.5 text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      attendeesExceedsCapacity
                        ? 'border-red-500 text-red-400 focus:border-red-500'
                        : 'border-white/10 text-white focus:border-brand-500'
                    }`}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Purpose</label>
                  <input
                    data-testid="book-purpose"
                    type="text"
                    value={bookForm.purpose}
                    onChange={(e) => setBookForm({ ...bookForm, purpose: e.target.value })}
                    placeholder="Optional"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <motion.button
                data-testid="confirm-booking"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                onClick={handleBook}
                disabled={bookingLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 mt-1 flex items-center justify-center gap-2 shadow-glow-blue transition-all"
              >
                {bookingLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Booking…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm Booking
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Fullscreen modal */}
      {sceneFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur">
          <button
            data-testid="exit-fullscreen-3d"
            onClick={() => setSceneFullscreen(false)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20"
          >
            Close ✕
          </button>
          <iframe
            src={iframeSrc}
            title={`${resource.name} 3D fullscreen`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </Shell>
  )
}

function PolicyRow({ label, value, valueEl, valueClass = 'text-white' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
      <span className="text-gray-400 text-sm">{label}</span>
      {valueEl || <span className={`text-sm ${valueClass}`}>{value}</span>}
    </div>
  )
}
