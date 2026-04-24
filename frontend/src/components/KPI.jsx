import { useEffect, useState, useRef } from 'react'
import { TrendingUp, Clock, Building2, Calendar, AlertTriangle, Users } from 'lucide-react'

const icons = {
  bookings: Calendar,
  pending: Clock,
  resources: Building2,
  upcoming: TrendingUp,
  conflicts: AlertTriangle,
  users: Users,
}

export default function KPI({ title, value, icon = 'bookings', trend, delay = 0 }) {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  const target = typeof value === 'number' ? value : 0

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  useEffect(() => {
    if (!visible) return
    const duration = 1500
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [visible, target])

  const Icon = icons[icon] || Calendar

  return (
    <div
      ref={ref}
      className={`glass-card p-6 hover-lift transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
          <Icon size={20} className="text-brand-400" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{typeof value === 'number' ? count : value}</p>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  )
}
