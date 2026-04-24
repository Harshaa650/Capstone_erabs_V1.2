import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

import Shell from '../components/Shell'
import KPI from '../components/KPI'
import ImageCarousel from '../components/ImageCarousel'
import AIAssistant from '../components/AIAssistant'
import { analytics, bookings, resources as resourcesApi } from '../lib/api'
import { getGalleryFor } from './Resources'
import {
  CalendarClock, Building2, ArrowRight, Zap, ChevronRight,
  Clock, Sparkles,
} from 'lucide-react'
import { fmtDate, fmtTime } from '../lib/dateUtils'

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [resourceList, setResourceList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [s, b, r] = await Promise.all([
          analytics.summary(),
          bookings.list('mine'),
          resourcesApi.list(),
        ])
        setSummary(s.data)
        setMyBookings(b.data.slice(0, 5))
        setResourceList(r.data)
      } catch {
        toast.error('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const kpiSlides = useMemo(() => ([
    [
      { title: 'Total bookings', value: summary?.total_bookings || 0, icon: 'bookings' },
      { title: 'Pending approvals', value: summary?.pending_approvals || 0, icon: 'pending' },
      { title: 'Active resources', value: summary?.active_resources || 0, icon: 'resources' },
      { title: 'Upcoming', value: summary?.upcoming || 0, icon: 'upcoming' },
    ],
    [
      { title: 'This week', value: summary?.trend?.reduce((a, d) => a + d.count, 0) || 0, icon: 'bookings' },
      { title: 'Departments', value: summary?.by_department?.length || 0, icon: 'users' },
      { title: 'Resource types', value: summary?.by_type?.length || 0, icon: 'resources' },
      { title: 'My bookings', value: myBookings.length, icon: 'upcoming' },
    ],
  ]), [summary, myBookings])

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
      {/* Creative hero header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel glass-card p-8 mb-6 relative overflow-hidden"
      >
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Overview
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">
              Hello, <span className="text-gradient">User</span>
            </h1>
            <p className="text-gray-300">Here&apos;s what&apos;s moving in your workspace today.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              data-testid="cta-resources"
              onClick={() => navigate('/resources')}
              className="btn-primary flex items-center gap-2"
            >
              Browse rooms <ArrowRight size={16} />
            </button>
            <button
              data-testid="cta-analytics"
              onClick={() => navigate('/analytics')}
              className="btn-secondary flex items-center gap-2"
            >
              See analytics
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 overview-kpi-carousel"
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView={1}
          loop
        >
          {kpiSlides.map((row, si) => (
            <SwiperSlide key={si}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {row.map((k, i) => (
                  <KPI key={i} title={k.title} value={k.value} icon={k.icon} delay={i * 80} />
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>

      {/* AI Assistant — directly below the overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              AI Assistant
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Ask it to find free rooms, analyze bookings or summarize your week.
            </p>
          </div>
          <button
            onClick={() => navigate('/assistant')}
            className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1"
          >
            Open full screen <ArrowRight size={14} />
          </button>
        </div>
        <AIAssistant variant="inline" />
      </motion.div>

      {/* Quick Book carousel — 5:2 landscape cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 quick-book-carousel"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap size={22} className="text-brand-400" />
              Quick book
            </h2>
            <p className="text-gray-400 text-sm mt-1">Tap a card to open the 3D view.</p>
          </div>
          <button
            data-testid="view-all-resources"
            onClick={() => navigate('/resources')}
            className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={16} />
          </button>
        </div>

        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          navigation
          pagination={{ clickable: true }}
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 3 },
          }}
          loop
        >
          {resourceList.map((res) => {
            const imgs = getGalleryFor(res)
            return (
              <SwiperSlide key={res.id}>
                <div
                  data-testid={`quick-book-${res.id}`}
                  className="glass-card overflow-hidden hover-lift cursor-pointer group flex flex-col"
                  onClick={() => navigate(`/resources/${res.id}`)}
                >
                  {/* 5:2 landscape aspect — wide banner */}
                  <div className="relative aspect-[5/2] bg-ink-900 flex-shrink-0">
                    <ImageCarousel images={imgs} autoPlayInterval={2000} height="100%" showDots={false} />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3 right-3 bg-ink-900/80 backdrop-blur px-2.5 py-1 rounded-full text-xs text-gray-200 border border-white/10 capitalize z-10">
                      {res.type}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-brand-500/80 backdrop-blur px-2.5 py-1 rounded-full text-xs text-white border border-white/10 z-10 capitalize flex items-center gap-1">
                      <Sparkles size={10} /> {res.scene_type}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-white font-semibold mb-1">{res.name}</h3>
                    <p className="text-gray-500 text-xs mb-3">{res.location} · cap {res.capacity}</p>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {res.requires_approval && (
                        <span className="text-amber-400 text-xs flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-full">
                          <Clock size={10} /> approval
                        </span>
                      )}
                      <span className="text-brand-400 text-xs bg-brand-500/10 px-2 py-1 rounded-full">
                        {res.avail_start}:00–{res.avail_end}:00
                      </span>
                    </div>
                    <button className="mt-auto w-full bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-glow-blue">
                      Book now
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </motion.div>

      {/* Recent bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
          <button
            onClick={() => navigate('/bookings')}
            className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1"
          >
            View all <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CalendarClock size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No bookings yet. Start by booking a resource!</p>
            </div>
          ) : (
            myBookings.map((bk) => (
              <div key={bk.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
                    <Building2 size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{bk.resource_name}</p>
                    <p className="text-gray-500 text-sm">
                      {fmtDate(bk.start_time)} · {fmtTime(bk.start_time)}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  bk.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  bk.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                  bk.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {bk.status}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </Shell>
  )
}
