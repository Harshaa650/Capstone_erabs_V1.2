import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Shell from '../components/Shell'
import KPI from '../components/KPI'
import {
  analytics, resources as resourcesApi, bookings, maintenance, audit as auditApi, departments as deptsApi
} from '../lib/api'
import {
  Shield, Building2, Users, BarChart3, Wrench, ClipboardList,
  Plus, X, ChevronDown, ChevronUp, Trash2, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Search, Filter, Briefcase, User as UserIcon
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { fmtDate, fmtTime, fmtDateTime } from '../lib/dateUtils'

const COLORS = ['#0b69ff', '#5ee7ff', '#7cf7c6', '#ffb547', '#ff6ad5', '#ef4444']

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [resourceList, setResourceList] = useState([])
  const [bookingList, setBookingList] = useState([])
  const [maintList, setMaintList] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddResource, setShowAddResource] = useState(false)
  const [showAddMaint, setShowAddMaint] = useState(false)
  const [expandedAudit, setExpandedAudit] = useState(false)
  
  // Department & Filtering State
  const [departmentList, setDepartmentList] = useState([])
  const [selectedDept, setSelectedDept] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [sortOption, setSortOption] = useState('creationDate')

  // Forms
  const [resourceForm, setResourceForm] = useState({
    name: '', type: 'room', description: '', capacity: 1,
    location: 'HQ', avail_start: 8, avail_end: 20,
    requires_approval: false, max_duration_min: 240, image_url: '',
  })
  const [maintForm, setMaintForm] = useState({
    resource_id: '', start: '', end: '', reason: 'Scheduled maintenance',
  })

  useEffect(() => {
    fetchAllData()
  }, [selectedDept])

  const fetchAllData = async () => {
    try {
      const [s, r, b, m, a, d] = await Promise.all([
        analytics.summary(),
        resourcesApi.list(),
        bookings.list('all', selectedDept === 'all' ? null : selectedDept),
        maintenance.list(),
        auditApi.list(),
        deptsApi.list(),
      ])
      setSummary(s.data)
      setResourceList(r.data)
      setBookingList(b.data)
      setMaintList(m.data)
      setAuditLogs(a.data)
      setDepartmentList(d.data)
    } catch (err) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = useMemo(() => {
    let list = [...bookingList]

    // Search by employee name
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(bk => bk.user_name?.toLowerCase().includes(q))
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter(bk => bk.status === statusFilter)
    }

    // Filter by date
    if (dateFilter) {
      list = list.filter(bk => fmtDate(bk.start_time) === fmtDate(dateFilter))
    }

    // Sort
    list.sort((a, b) => {
      if (sortOption === 'creationDate') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else {
        return new Date(b.start_time) - new Date(a.start_time)
      }
    })

    return list
  }, [bookingList, searchQuery, statusFilter, dateFilter, sortOption])

  const handleAddResource = async (e) => {
    e.preventDefault()
    try {
      await resourcesApi.create(resourceForm)
      toast.success('Resource created')
      setShowAddResource(false)
      setResourceForm({
        name: '', type: 'room', description: '', capacity: 1,
        location: 'HQ', avail_start: 8, avail_end: 20,
        requires_approval: false, max_duration_min: 240, image_url: '',
      })
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create resource')
    }
  }

  const handleDeleteResource = async (id) => {
    if (!confirm('Are you sure you want to deactivate this resource?')) return
    try {
      await resourcesApi.delete(id)
      toast.success('Resource deactivated')
      fetchAllData()
    } catch (err) {
      toast.error('Failed to deactivate')
    }
  }

  const handleAddMaint = async (e) => {
    e.preventDefault()
    try {
      // maintForm.start is "YYYY-MM-DDTHH:MM" from datetime-local input (browser local = IST)
      // Append IST offset so backend stores correctly
      const toIST = (dtLocal) => dtLocal ? dtLocal + ':00+05:30' : ''
      await maintenance.create({
        resource_id: maintForm.resource_id,
        start_time: toIST(maintForm.start),
        end_time: toIST(maintForm.end),
        reason: maintForm.reason,
      })
      toast.success('Maintenance block created')
      setShowAddMaint(false)
      setMaintForm({ resource_id: '', start: '', end: '', reason: 'Scheduled maintenance' })
      fetchAllData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create maintenance block')
    }
  }

  const handleDeleteMaint = async (id) => {
    try {
      await maintenance.delete(id)
      toast.success('Maintenance block removed')
      fetchAllData()
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: Building2 },
    { id: 'bookings', label: 'All Bookings', icon: ClipboardList },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ]

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
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 px-3 py-1 rounded-full text-xs text-brand-300 mb-3">
            <Shield size={12} /> Admin Panel
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            System <span className="text-gradient">Management</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Manage resources, approve bookings, schedule maintenance windows and monitor the full audit trail — all from one cockpit.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5 text-sm">
            <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} /> {summary?.active_resources || 0} resources live
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
              <Clock size={14} /> {summary?.pending_approvals || 0} pending approvals
            </span>
            <span className="flex items-center gap-1.5 text-brand-300 bg-brand-500/10 border border-brand-500/30 px-3 py-1.5 rounded-lg">
              <TrendingUp size={14} /> {summary?.upcoming || 0} upcoming bookings
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPI title="Total bookings" value={summary?.total_bookings || 0} icon="bookings" delay={0} />
        <KPI title="Pending approvals" value={summary?.pending_approvals || 0} icon="pending" delay={100} />
        <KPI title="Active resources" value={summary?.active_resources || 0} icon="resources" delay={200} />
        <KPI title="Departments" value={summary?.by_department?.length || 0} icon="users" delay={300} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-glow-blue'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Department Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Bookings by Department</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summary?.by_department || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#111827] p-5 border border-white/10 shadow-2xl rounded-xl min-w-[220px] z-50">
                            <p className="text-white font-bold text-base mb-3 border-b border-white/10 pb-2 uppercase tracking-wider">{data.name}</p>
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center text-gray-200">
                                <span className="text-sm font-medium">Total Bookings</span>
                                <span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-white">{data.total}</span>
                              </div>
                              <div className="pt-1 border-t border-white/5 space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Approved</span>
                                  <span className="text-xs font-semibold text-green-400">{data.approved}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Pending</span>
                                  <span className="text-xs font-semibold text-amber-400">{data.pending}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Completed</span>
                                  <span className="text-xs font-semibold text-blue-400">{data.completed}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-400">Cancelled</span>
                                  <span className="text-xs font-semibold text-red-400">{data.cancelled}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#0b69ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Type Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Bookings by Resource Type</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={summary?.by_type || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(summary?.by_type || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="glass-card p-3 border border-brand-500/20 backdrop-blur-xl">
                            <p className="text-white font-semibold mb-1">{data.name}</p>
                            <p className="text-brand-400 text-xs">
                              Count: <span className="font-bold">{data.value}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">All Resources ({resourceList.length})</h2>
            <button
              onClick={() => setShowAddResource(!showAddResource)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Resource
            </button>
          </div>

          {/* Add Resource Form */}
          {showAddResource && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddResource}
              className="glass-card p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">New Resource</h3>
                <button type="button" onClick={() => setShowAddResource(false)} className="text-gray-500 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <select
                  value={resourceForm.type}
                  onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="room" className="bg-ink-800">Room</option>
                  <option value="desk" className="bg-ink-800">Desk</option>
                  <option value="projector" className="bg-ink-800">Projector</option>
                  <option value="vehicle" className="bg-ink-800">Vehicle</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={resourceForm.location}
                  onChange={(e) => setResourceForm({ ...resourceForm, location: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <input
                  type="number"
                  placeholder="Capacity"
                  min="1"
                  value={resourceForm.capacity}
                  onChange={(e) => setResourceForm({ ...resourceForm, capacity: parseInt(e.target.value) || 1 })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={resourceForm.image_url}
                  onChange={(e) => setResourceForm({ ...resourceForm, image_url: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resourceForm.requires_approval}
                      onChange={(e) => setResourceForm({ ...resourceForm, requires_approval: e.target.checked })}
                      className="w-4 h-4 accent-brand-500"
                    />
                    Requires Approval
                  </label>
                </div>
              </div>
              <button type="submit" className="mt-4 btn-primary">Create Resource</button>
            </motion.form>
          )}

          {/* Resources List */}
          <div className="space-y-3">
            {resourceList.map((res) => (
              <div key={res.id} className="glass-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-center gap-4">
                  <img
                    src={res.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100'}
                    alt={res.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="text-white font-semibold">{res.name}</h3>
                    <p className="text-gray-500 text-sm">{res.location} · {res.type} · Cap: {res.capacity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {res.requires_approval && (
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30">
                      Approval
                    </span>
                  )}
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    res.active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {res.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleDeleteResource(res.id)}
                    className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                    title="Deactivate"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Bookings Tab */}
      {activeTab === 'bookings' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar / Department Selector */}
            <div className="lg:w-64 flex-shrink-0">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 px-2">Departments</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedDept('all')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    selectedDept === 'all'
                      ? 'bg-brand-500 text-white shadow-glow-blue'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Briefcase size={16} /> All Departments
                </button>
                {departmentList.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
                      selectedDept === dept.id
                        ? 'bg-brand-500 text-white shadow-glow-blue'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Users size={16} /> {dept.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-white">
                  {selectedDept === 'all' ? 'All Bookings' : departmentList.find(d => d.id === selectedDept)?.name + ' Bookings'}
                  <span className="text-gray-500 text-sm font-normal ml-2">({filteredBookings.length})</span>
                </h2>
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 appearance-none"
                  >
                    <option value="all" className="bg-ink-900">All Statuses</option>
                    <option value="pending" className="bg-ink-900">Pending</option>
                    <option value="approved" className="bg-ink-900">Approved</option>
                    <option value="completed" className="bg-ink-900">Completed</option>
                    <option value="rejected" className="bg-ink-900">Rejected</option>
                    <option value="cancelled" className="bg-ink-900">Cancelled</option>
                  </select>
                </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 appearance-none"
                >
                  <option value="creationDate" className="bg-ink-900">Sort: Latest Created</option>
                  <option value="bookingDate" className="bg-ink-900">Sort: Latest Booking</option>
                </select>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="glass-card p-12 text-center text-gray-500">
                    <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                    No bookings found matching your filters.
                  </div>
                ) : (
                  filteredBookings.map((bk) => {
                    const statusColors = {
                      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
                      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
                      cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    }
                    return (
                      <div key={bk.id} className="glass-card p-5 hover:bg-white/[0.07] transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                              <Building2 size={24} className="text-brand-400 group-hover:text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h4 className="text-white font-bold text-lg truncate">{bk.resource_name}</h4>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${statusColors[bk.status] || statusColors.pending}`}>
                                  {bk.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                <span className="text-brand-300 flex items-center gap-1.5">
                                  <UserIcon size={12} /> {bk.user_name}
                                  <span className="text-gray-600 font-normal ml-1">({bk.user_role})</span>
                                </span>
                                <span className="text-gray-500 flex items-center gap-1.5">
                                  <Briefcase size={12} /> {bk.user_department}
                                </span>
                                <span className="text-gray-500 flex items-center gap-1.5">
                                  <Clock size={12} /> {fmtDate(bk.start_time)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                            <span className="text-white font-medium text-sm">
                              {fmtTime(bk.start_time)} — {fmtTime(bk.end_time)}
                            </span>
                            <span className="text-gray-600 text-[10px] uppercase tracking-widest">
                              Created {fmtDate(bk.created_at)}
                            </span>
                          </div>
                        </div>
                        {bk.purpose && (
                          <div className="mt-4 p-3 bg-white/5 rounded-xl text-gray-400 text-sm italic">
                            &ldquo;{bk.purpose}&rdquo;
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )
    }

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Maintenance Blocks ({maintList.length})</h2>
            <button
              onClick={() => setShowAddMaint(!showAddMaint)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Block
            </button>
          </div>

          {showAddMaint && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddMaint}
              className="glass-card p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={maintForm.resource_id}
                  onChange={(e) => setMaintForm({ ...maintForm, resource_id: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="" className="bg-ink-800">Select Resource</option>
                  {resourceList.map((r) => (
                    <option key={r.id} value={r.id} className="bg-ink-800">{r.name}</option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={maintForm.start}
                  onChange={(e) => setMaintForm({ ...maintForm, start: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <input
                  type="datetime-local"
                  value={maintForm.end}
                  onChange={(e) => setMaintForm({ ...maintForm, end: e.target.value })}
                  required
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={maintForm.reason}
                  onChange={(e) => setMaintForm({ ...maintForm, reason: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <button type="submit" className="mt-4 btn-primary">Create Block</button>
            </motion.form>
          )}

          <div className="space-y-3">
            {maintList.map((m) => (
              <div key={m.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.07]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={18} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {resourceList.find((r) => r.id === m.resource_id)?.name || `Resource #${m.resource_id}`}
                    </p>
                    <p className="text-gray-500 text-sm">{m.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm">
                    {fmtDate(m.start_time)} — {fmtDate(m.end_time)}
                  </span>
                  <button
                    onClick={() => handleDeleteMaint(m.id)}
                    className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {maintList.length === 0 && (
              <div className="glass-card p-12 text-center">
                <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                <p className="text-gray-400">No maintenance blocks scheduled.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Audit Log ({auditLogs.length} entries)</h2>
            <button
              onClick={() => setExpandedAudit(!expandedAudit)}
              className="text-brand-400 text-sm flex items-center gap-1 hover:text-brand-300"
            >
              {expandedAudit ? 'Show less' : 'Show all'}
              {expandedAudit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className="space-y-2">
            {(expandedAudit ? auditLogs : auditLogs.slice(0, 10)).map((log) => (
              <div key={log.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.07]">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center">
                    <Shield size={14} className="text-brand-400" />
                  </div>
                  <div>
                    <span className="text-brand-300 text-sm font-medium capitalize">{log.action}</span>
                    <span className="text-gray-500 text-sm"> {log.entity} #{log.entity_id}</span>
                    {log.details && <p className="text-gray-600 text-xs">{log.details}</p>}
                  </div>
                </div>
                <span className="text-gray-600 text-xs">
                  {fmtDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </Shell>
  )
}
