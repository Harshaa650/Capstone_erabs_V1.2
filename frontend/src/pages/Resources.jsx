import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import ImageCarousel from '../components/ImageCarousel'
import { resources as resourcesApi } from '../lib/api'
import { FALLBACK_RESOURCES } from '../lib/fallbackResources'
import { Building2, Search, Users, Clock, Sparkles } from 'lucide-react'

// Stock galleries keyed by scene_type
const SCENE_GALLERIES = {
  large: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
  ],
  medium: [
    'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80',
  ],
  normal: [
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80',
    'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1200&q=80',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80',
  ],
  cabin: [
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80',
    'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  ],
  manager: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80',
  ],
  chess: [
    'https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80',
    'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=1200&q=80',
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&q=80',
    'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=1200&q=80',
    'https://images.unsplash.com/photo-1543092587-d8b8feaf362b?w=1200&q=80',
  ],
  foosball: [
    'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80',
    'https://images.unsplash.com/photo-1589983411583-75777797cc3c?w=1200&q=80',
    'https://images.unsplash.com/photo-1577221084712-45b0445d2b00?w=1200&q=80',
    'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1200&q=80',
  ],
}

const TYPE_FALLBACK = {
  projector: [
    'https://images.unsplash.com/photo-1489844097929-c8d5b91c456e?w=1200&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80',
    'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=1200&q=80',
  ],
  desk: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80',
  ],
  vehicle: [
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80',
  ],
  recreation: [
    'https://images.unsplash.com/photo-1560174038-594a18c76bc1?w=1200&q=80',
    'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=1200&q=80',
  ],
}

export function getGalleryFor(res) {
  if (!res) return []
  const base = SCENE_GALLERIES[res.scene_type] || TYPE_FALLBACK[res.type] || SCENE_GALLERIES.normal
  const hero = res.image_url || base[0]
  return [hero, ...base.filter((x) => x !== hero)].slice(0, 5)
}

export default function Resources() {
  const navigate = useNavigate()
  const [resourceList, setResourceList] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await resourcesApi.list()
        setResourceList((res.data && res.data.length) ? res.data : FALLBACK_RESOURCES)
      } catch {
        toast.error('Failed to load resources')
        setResourceList(FALLBACK_RESOURCES)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let result = resourceList
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q),
      )
    }
    if (typeFilter !== 'all') result = result.filter((r) => r.type === typeFilter)
    return result
  }, [resourceList, search, typeFilter])

  const types = ['all', ...new Set(resourceList.map((r) => r.type))]

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <p className="text-brand-400 text-sm font-semibold uppercase tracking-wider mb-1">Resources</p>
        <h1 className="text-3xl font-bold text-white">Browse <span className="text-gradient">Spaces</span></h1>
      </motion.div>

      {/* Search & Filter — compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 mb-4"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            data-testid="resources-search"
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {types.map((t) => (
            <button
              key={t}
              data-testid={`filter-type-${t}`}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                typeFilter === t
                  ? 'bg-brand-500 text-white shadow-glow-blue'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.div>

      {/* 3-column grid on large screens for better use of space */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((res, i) => {
          const images = getGalleryFor(res)
          return (
            <motion.div
              key={res.id}
              data-testid={`resource-card-${res.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card overflow-hidden hover-lift cursor-pointer group flex flex-row"
              onClick={() => navigate(`/resources/${res.id}`)}
            >
              {/* Horizontal card layout — image left, info right */}
              <div className="relative w-2/5 bg-ink-900 aspect-[5/4] flex-shrink-0">
                <ImageCarousel images={images} autoPlayInterval={2000} height="100%" showDots={false} />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-900/30 pointer-events-none" />
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  <span className="bg-ink-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white border border-white/10 capitalize">
                    {res.type}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 z-10">
                  <span className="bg-brand-500/90 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white border border-white/20 capitalize flex items-center gap-1">
                    <Sparkles size={9} /> {res.scene_type}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 flex flex-col min-w-0">
                <div className="flex items-start justify-between mb-1 gap-2">
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors truncate">
                    {res.name}
                  </h3>
                  <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                    <Users size={10} /> {res.capacity}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1">{res.description}</p>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Building2 size={10} className="text-brand-400" />
                      {res.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="text-brand-400" />
                      {res.avail_start}:00–{res.avail_end}:00
                    </span>
                    {res.requires_approval && (
                      <span className="text-amber-400">· approval</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-brand-400 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  View details <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-16 text-center mt-4">
          <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No resources found matching your criteria.</p>
          <button
            onClick={() => { setSearch(''); setTypeFilter('all') }}
            className="mt-4 text-brand-400 hover:text-brand-300"
          >
            Clear filters
          </button>
        </div>
      )}
    </Shell>
  )
}
