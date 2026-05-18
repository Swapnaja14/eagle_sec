import apiClient from './client';
import { ENDPOINTS } from '../utils/constants';

/**
 * Safely normalize API response to array
 */
const normalizeResponse = (response) => {
  try {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.results)) return response.results;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (typeof response === 'object' && response) return [response];
    return [];
  } catch (err) {
    console.error('[coursesApi] Normalization error:', err);
    return [];
  }
};

/**
 * Courses API endpoints with comprehensive error handling
 */
export const coursesApi = {
  /**
   * Get all courses
   */
  getCourses: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const url = query ? `${ENDPOINTS.COURSES}?${query}` : ENDPOINTS.COURSES;
      const response = await apiClient.get(url);
      
      const data = response?.data || response;
      const normalized = normalizeResponse(data);
      
      console.log('[coursesApi] Fetched courses:', normalized.length);
      return normalized;
    } catch (err) {
      console.error('[coursesApi] Get courses error:', err);
      throw new Error(err?.message || 'Failed to fetch courses');
    }
  },

  /**
   * Get single course details with lessons and materials
   */
  getCourseDetail: async (courseId) => {
    try {
      if (!courseId) throw new Error('Course ID is required');
      
      const response = await apiClient.get(ENDPOINTS.COURSE_DETAIL(courseId));
      const data = response?.data || response;
      
      if (!data) throw new Error('No course data returned');
      
      // Ensure lessons array exists
      if (!data.lessons) data.lessons = [];
      
      // Ensure each lesson has files array
      data.lessons = data.lessons.map(lesson => ({
        ...lesson,
        files: lesson.files || [],
      }));
      
      console.log('[coursesApi] Course detail:', data.display_name, 'Lessons:', data.lessons.length);
      return data;
    } catch (err) {
      console.error('[coursesApi] Get course detail error:', err);
      throw new Error(err?.message || 'Failed to fetch course details');
    }
  },

  /**
   * Get course lessons with study materials
   */
  getCourseLessons: async (courseId) => {
    try {
      if (!courseId) throw new Error('Course ID is required');
      
      const response = await apiClient.get(ENDPOINTS.COURSE_LESSONS(courseId));
      const data = response?.data || response;
      const normalized = normalizeResponse(data);
      
      // Ensure each lesson has files array
      const lessons = normalized.map(lesson => ({
        ...lesson,
        files: lesson.files || [],
      }));
      
      console.log('[coursesApi] Fetched lessons:', lessons.length);
      return lessons;
    } catch (err) {
      console.error('[coursesApi] Get lessons error:', err);
      throw new Error(err?.message || 'Failed to fetch lessons');
    }
  },

  /**
   * Get course statistics
   */
  getCourseStats: async (courseId) => {
    try {
      if (!courseId) throw new Error('Course ID is required');
      
      const response = await apiClient.get(`${ENDPOINTS.COURSE_DETAIL(courseId)}stats/`);
      return response?.data || response || {};
    } catch (err) {
      console.error('[coursesApi] Get stats error:', err);
      return {};
    }
  },
};
