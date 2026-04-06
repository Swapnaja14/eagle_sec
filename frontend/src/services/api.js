import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')

        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ===================== AUTH =====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  me: () => api.get('/auth/me/'),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
}

// ===================== CONTENT =====================
export const contentAPI = {
  list: (params) => api.get('/content/files/', { params }),
  get: (id) => api.get(`/content/files/${id}/`),
  upload: (formData, onProgress) => api.post('/content/files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  }),
  update: (id, data) => api.patch(`/content/files/${id}/`, data),
  delete: (id) => api.delete(`/content/files/${id}/`),
  archive: (id) => api.post(`/content/files/${id}/archive/`),
  listTags: () => api.get('/content/tags/'),
  createTag: (name) => api.post('/content/tags/', { name }),
}

// ===================== COURSES =====================
export const coursesAPI = {
  list: (params) => api.get('/courses/', { params }),
  get: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}/`, data),
  delete: (id) => api.delete(`/courses/${id}/`),
  retire: (id) => api.post(`/courses/${id}/retire/`),
  activate: (id) => api.post(`/courses/${id}/activate/`),
  clone: (id) => api.post(`/courses/${id}/clone/`),

  // Lessons
  listLessons: (courseId) => api.get(`/courses/${courseId}/lessons/`),
  createLesson: (courseId, data) => api.post(`/courses/${courseId}/lessons/`, data),
  updateLesson: (courseId, lessonId, data) => api.patch(`/courses/${courseId}/lessons/${lessonId}/`, data),
  deleteLesson: (courseId, lessonId) => api.delete(`/courses/${courseId}/lessons/${lessonId}/`),
  reorderLessons: (courseId, data) => api.post(`/courses/${courseId}/lessons/reorder/`, data),

  // Lesson Files
  uploadLessonFile: (courseId, lessonId, formData) => api.post(
    `/courses/${courseId}/lessons/${lessonId}/files/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ),
  deleteLessonFile: (courseId, lessonId, fileId) =>
    api.delete(`/courses/${courseId}/lessons/${lessonId}/files/${fileId}/`),
  updateLessonFile: (courseId, lessonId, fileId, data) =>
    api.patch(`/courses/${courseId}/lessons/${lessonId}/files/${fileId}/`, data),

  // Pre-Assessment
  getPreAssessment: (courseId) => api.get(`/courses/${courseId}/pre-assessment/`),
  updatePreAssessment: (courseId, id, data) => api.patch(`/courses/${courseId}/pre-assessment/${id}/`, data),

  // Post-Assessment
  getPostAssessment: (courseId) => api.get(`/courses/${courseId}/post-assessment/`),
  updatePostAssessment: (courseId, id, data) => api.patch(`/courses/${courseId}/post-assessment/${id}/`, data),

  // Certification
  getCertification: (courseId) => api.get(`/courses/${courseId}/certification/`),
  updateCertification: (courseId, id, data) => api.patch(`/courses/${courseId}/certification/${id}/`, data),
  addBatchExpiry: (courseId, data) => api.post(`/courses/${courseId}/certification/add_batch_expiry/`, data),
}

// ===================== QUESTIONS =====================
export const questionsAPI = {
  list: (params) => api.get('/questions/', { params }),
  create: (data) => api.post('/questions/', data),
  update: (id, data) => api.patch(`/questions/${id}/`, data),
  delete: (id) => api.delete(`/questions/${id}/`),
  byLanguage: () => api.get('/questions/by_language/'),
}
