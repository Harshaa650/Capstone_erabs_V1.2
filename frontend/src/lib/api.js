import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api

export const auth = {
  login: (email, password) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
}

export const resources = {
  list: (params = {}) => api.get('/resources', { params }),
  get: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
}

export const bookings = {
  list: (scope = 'mine', department = null) => {
    let url = `/bookings?scope=${scope}`
    if (department) url += `&department=${department}`
    return api.get(url)
  },
  create: (data) => api.post('/bookings', data),
  validate: (data) => api.post('/bookings/validate', data),
  approve: (id, comment = '') => api.post(`/bookings/${id}/approve?comment=${encodeURIComponent(comment)}`),
  reject: (id, comment = '') => api.post(`/bookings/${id}/reject?comment=${encodeURIComponent(comment)}`),
  cancel: (id) => api.post(`/bookings/${id}/cancel`),
  complete: (id) => api.post(`/bookings/${id}/complete`),
}

export const maintenance = {
  list: () => api.get('/maintenance'),
  create: (data) => api.post('/maintenance', data),
  delete: (id) => api.delete(`/maintenance/${id}`),
}

export const analytics = {
  summary: () => api.get('/analytics/summary'),
}

export const audit = {
  list: () => api.get('/audit'),
}

export const departments = {
  list: () => api.get('/departments'),
}
