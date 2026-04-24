import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import EmployeeDashboard from './pages/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Resources from './pages/Resources'
import RoomDetail from './pages/RoomDetail'
import Room3DViewer from './pages/Room3DViewer'
import MyBookings from './pages/MyBookings'
import Approvals from './pages/Approvals'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import AssistantPage from './pages/AssistantPage'

function PrivateRoute({ children, requiredRoles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-800 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room3d" element={<Room3DViewer />} />
      <Route path="/dashboard" element={<PrivateRoute><EmployeeDashboard /></PrivateRoute>} />
      <Route path="/resources" element={<PrivateRoute><Resources /></PrivateRoute>} />
      <Route path="/resources/:id" element={<PrivateRoute><RoomDetail /></PrivateRoute>} />
      <Route path="/bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      <Route path="/assistant" element={<PrivateRoute><AssistantPage /></PrivateRoute>} />
      <Route path="/approvals" element={<PrivateRoute requiredRoles={['manager', 'admin']}><Approvals /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute requiredRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/manager" element={<PrivateRoute requiredRoles={['manager', 'admin']}><ManagerDashboard /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
