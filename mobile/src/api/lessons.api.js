import apiClient from './client';
import { ENDPOINTS } from '../utils/constants';

/**
 * Safe response normalization
 */
const normalizeResponse = (response) => {
  try {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.results)) return response.results;
    if (response.data && Array.isArray(response.data)) return response.data;
    return [];
  } catch (err) {
    console.error('[lessonsApi] Normalization error:', err);
    return [];
  }
};

/**
 * Lessons API - Fetch lessons and materials for enrolled trainees
 * Handles safe data fetching and normalization
 */
export const lessonsApi = {
  /**
   * Get lessons for a specific course
   * Returns guaranteed array
   */
  getCourseLessons: async (courseId) => {
    try {
      if (!courseId) throw new Error('Course ID is required');

      console.log('[lessonsApi] Fetching lessons for course:', courseId);

      // Endpoint: /api/courses/{courseId}/lessons/
      const response = await apiClient.get(`/courses/${courseId}/lessons/`);

      // Handle response
      const data = response?.data || response;
      const normalized = normalizeResponse(data);

      console.log('[lessonsApi] Fetched lessons:', normalized.length);
      return normalized;
    } catch (err) {
      console.error('[lessonsApi] Get lessons error:', err);
      throw new Error(err?.message || 'Failed to fetch lessons');
    }
  },

  /**
   * Get lesson detail with files/materials
   * Returns single lesson object with nested files
   */
  getLessonDetail: async (courseId, lessonId) => {
    try {
      if (!courseId || !lessonId) {
        throw new Error('Course ID and Lesson ID are required');
      }

      console.log('[lessonsApi] Fetching lesson:', lessonId, 'for course:', courseId);

      // Endpoint: /api/courses/{courseId}/lessons/{lessonId}/
      const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}/`);

      const data = response?.data || response;

      if (!data) {
        throw new Error('No lesson data returned');
      }

      // Ensure files is always an array
      if (data.files && !Array.isArray(data.files)) {
        data.files = [];
      } else if (!data.files) {
        data.files = [];
      }

      console.log('[lessonsApi] Fetched lesson with files:', data.files?.length || 0);
      return data;
    } catch (err) {
      console.error('[lessonsApi] Get lesson detail error:', err);
      throw new Error(err?.message || 'Failed to fetch lesson details');
    }
  },

  /**
   * Get files for a lesson
   * Returns guaranteed array of lesson files
   */
  getLessonFiles: async (courseId, lessonId) => {
    try {
      if (!courseId || !lessonId) {
        throw new Error('Course ID and Lesson ID are required');
      }

      console.log('[lessonsApi] Fetching files for lesson:', lessonId);

      // Endpoint: /api/courses/{courseId}/lessons/{lessonId}/files/
      const response = await apiClient.get(
        `/courses/${courseId}/lessons/${lessonId}/files/`
      );

      const data = response?.data || response;
      const normalized = normalizeResponse(data);

      console.log('[lessonsApi] Fetched files:', normalized.length);
      return normalized;
    } catch (err) {
      console.error('[lessonsApi] Get files error:', err);
      throw new Error(err?.message || 'Failed to fetch lesson files');
    }
  },

  /**
   * Get file/material download URL
   * Returns file URL for streaming/download
   */
  getFileUrl: (courseId, lessonId, fileId) => {
    try {
      if (!courseId || !lessonId || !fileId) {
        throw new Error('Course ID, Lesson ID, and File ID are required');
      }

      // Build download URL
      const baseUrl = apiClient.baseURL || '';
      const url = `${baseUrl}/courses/${courseId}/lessons/${lessonId}/files/${fileId}/download/`;

      console.log('[lessonsApi] File URL:', url);
      return url;
    } catch (err) {
      console.error('[lessonsApi] Get file URL error:', err);
      throw new Error(err?.message || 'Failed to get file URL');
    }
  },

  /**
   * Download a lesson file
   * Returns file blob for saving
   */
  downloadFile: async (courseId, lessonId, fileId) => {
    try {
      if (!courseId || !lessonId || !fileId) {
        throw new Error('Course ID, Lesson ID, and File ID are required');
      }

      console.log('[lessonsApi] Downloading file:', fileId);

      const response = await apiClient.get(
        `/courses/${courseId}/lessons/${lessonId}/files/${fileId}/download/`,
        {
          responseType: 'blob',
        }
      );

      const blob = response?.data || response;

      if (!blob) {
        throw new Error('No file data received');
      }

      console.log('[lessonsApi] File downloaded successfully');
      return blob;
    } catch (err) {
      console.error('[lessonsApi] Download file error:', err);
      throw new Error(err?.message || 'Failed to download file');
    }
  },

  /**
   * Mark lesson as viewed/completed
   * For tracking trainee progress
   */
  markLessonViewed: async (courseId, lessonId) => {
    try {
      if (!courseId || !lessonId) {
        throw new Error('Course ID and Lesson ID are required');
      }

      console.log('[lessonsApi] Marking lesson as viewed:', lessonId);

      const response = await apiClient.post(
        `/courses/${courseId}/lessons/${lessonId}/mark-viewed/`
      );

      console.log('[lessonsApi] Lesson marked as viewed');
      return response?.data || response;
    } catch (err) {
      console.error('[lessonsApi] Mark viewed error:', err);
      // Don't throw - this is optional tracking
      return { success: false, message: err?.message };
    }
  },
};
