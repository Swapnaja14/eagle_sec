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

        const { data } = await api.post('/auth/refresh/', { refresh })
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
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
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

  // Pre-Assessment (OneToOne per course — no separate id needed)
  getPreAssessment: (courseId) => api.get(`/courses/${courseId}/pre-assessment/`),
  updatePreAssessment: (courseId, _id, data) => api.patch(`/courses/${courseId}/pre-assessment/${_id}/`, data),

  // Post-Assessment (OneToOne per course — no separate id needed)
  getPostAssessment: (courseId) => api.get(`/courses/${courseId}/post-assessment/`),
  updatePostAssessment: (courseId, _id, data) => api.patch(`/courses/${courseId}/post-assessment/${_id}/`, data),

  // Certification (OneToOne per course — no separate id needed)
  getCertification: (courseId) => api.get(`/courses/${courseId}/certification/`),
  updateCertification: (courseId, _id, data) => api.patch(`/courses/${courseId}/certification/${_id}/`, data),
  addBatchExpiry: (courseId, data) => api.post(`/courses/${courseId}/certification/add_batch_expiry/`, data),

  // Course Stats & Enrollments
  getStats: (courseId) => api.get(`/courses/${courseId}/stats/`),
  getEnrollments: (courseId) => api.get(`/courses/${courseId}/enrollments/`),
  enrollTrainees: (courseId, data) => api.post(`/courses/${courseId}/enroll/`, data),
}

// ===================== QUESTIONS =====================
export const questionsAPI = {
  list: (params) => api.get('/questions/', { params }),
  create: (data) => api.post('/questions/', data),
  update: (id, data) => api.patch(`/questions/${id}/`, data),
  delete: (id) => api.delete(`/questions/${id}/`),
  byLanguage: () => api.get('/questions/by_language/'),
}

// ===================== TRAINING HISTORY =====================
export const trainingHistoryAPI = {
  myHistory: (params) => api.get('/training-history/my/', { params }),
}

// ===================== SESSIONS =====================
export const sessionsAPI = {
  calendar: (params) => api.get('/sessions/calendar/', { params }),
  list: (params) => api.get('/sessions/', { params }),
  create: (data) => api.post('/sessions/', data),
  update: (id, data) => api.patch(`/sessions/${id}/`, data),
  remove: (id) => api.delete(`/sessions/${id}/`),
  trainers: () => api.get('/sessions/trainers/'),
  getMySessions: (params) => api.get('/trainer/sessions/', { params }),
}

// ===================== SITES & CLIENTS =====================
export const sitesAPI = {
  list: (params) => api.get('/auth/sites/', { params }),
  create: (data) => api.post('/auth/sites/', data),
  update: (id, data) => api.patch(`/auth/sites/${id}/`, data),
  delete: (id) => api.delete(`/auth/sites/${id}/`),
}

export const clientsAPI = {
  list: (params) => api.get('/auth/clients/', { params }),
  create: (data) => api.post('/auth/clients/', data),
  update: (id, data) => api.patch(`/auth/clients/${id}/`, data),
  delete: (id) => api.delete(`/auth/clients/${id}/`),
}

// ===================== EMPLOYEES =====================
export const employeesAPI = {
  list: (params) => api.get('/auth/employees/', { params }),
}

// ===================== DEPARTMENTS =====================
export const departmentsAPI = {
  list: () => api.get('/auth/departments/'),
}

// ===================== TRAINING TOPICS =====================
export const trainingTopicsAPI = {
  list: () => api.get('/courses/training-topics/'),
}

// ===================== ANALYTICS =====================
export const analyticsAPI = {
  summary: () => api.get('/analytics/summary/'),
  employeeProgress: (id) => api.get(`/analytics/employee/${id}/`),
  trainerPerformance: (id) => api.get(`/analytics/trainer/${id}/`),
  gapAnalysis: (params) => api.get('/analytics/gap-analysis/', { params }),
  report: () => api.get('/analytics/report/', { responseType: 'blob' }),
}

// ===================== DASHBOARD =====================
export const dashboardAPI = {
  trainerDashboard: () => api.get('/trainer/dashboard/'),
  traineeDashboard: () => api.get('/trainee/dashboard/'),
  traineeCourses: () => api.get('/trainee/courses/'),
}

// ===================== ASSESSMENTS =====================
export const assessmentsAPI = {
  // Quizzes
  listQuizzes: (params) => api.get('/assessments/quizzes/', { params }),
  getQuiz: (id) => api.get(`/assessments/quizzes/${id}/`),
  createQuiz: (data) => api.post('/assessments/quizzes/', data),
  updateQuiz: (id, data) => api.patch(`/assessments/quizzes/${id}/`, data),
  deleteQuiz: (id) => api.delete(`/assessments/quizzes/${id}/`),
  startQuiz: (id) => api.post(`/assessments/quizzes/${id}/start_quiz/`),
  getQuizQuestions: (id) => api.get(`/assessments/quizzes/${id}/questions/`),
  addQuestionToQuiz: (id, data) => api.post(`/assessments/quizzes/${id}/add_question/`, data),
  getTrainers: () => api.get('/assessments/quizzes/trainers/'),

  // Submissions
  listSubmissions: (params) => api.get('/assessments/submissions/', { params }),
  getSubmission: (id) => api.get(`/assessments/submissions/${id}/`),
  submitAnswer: (id, data) => api.post(`/assessments/submissions/${id}/submit_answer/`, data),
  completeSubmission: (id) => api.post(`/assessments/submissions/${id}/complete_submission/`),
  mySubmissions: () => api.get('/assessments/submissions/my_submissions/'),
  allSubmissions: (params) => api.get('/assessments/submissions/all_submissions/', { params }),
}
