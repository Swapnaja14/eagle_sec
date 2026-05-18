import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '../api/courses.api';
import storageService from '../services/storageService';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Custom hook for managing courses data
 */
export const useCourses = (autoFetch = true) => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch courses from API
  const fetchCourses = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await coursesApi.getCourses(params);
      const coursesData = response.results || response;

      setCourses(coursesData);

      // Cache courses data
      await storageService.cacheData(
        STORAGE_KEYS.CACHED_COURSES,
        coursesData,
        60 // Cache for 60 minutes
      );

      return coursesData;
    } catch (err) {
      setError(err.message || 'Failed to fetch courses');
      
      // Try to load from cache on error
      const cachedCourses = await storageService.getCachedData(
        STORAGE_KEYS.CACHED_COURSES
      );
      if (cachedCourses) {
        setCourses(cachedCourses);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh courses (pull-to-refresh)
  const refreshCourses = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchCourses();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCourses]);

  // Load cached courses on mount
  useEffect(() => {
    const loadCachedCourses = async () => {
      const cachedCourses = await storageService.getCachedData(
        STORAGE_KEYS.CACHED_COURSES
      );
      if (cachedCourses) {
        setCourses(cachedCourses);
      }
    };

    loadCachedCourses();

    if (autoFetch) {
      fetchCourses();
    }
  }, [autoFetch, fetchCourses]);

  return {
    courses,
    isLoading,
    error,
    isRefreshing,
    fetchCourses,
    refreshCourses,
  };
};

/**
 * Custom hook for single course detail
 */
export const useCourseDetail = (courseId) => {
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourseDetail = useCallback(async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [courseData, lessonsData] = await Promise.all([
        coursesApi.getCourseDetail(courseId),
        coursesApi.getCourseLessons(courseId),
      ]);

      setCourse(courseData);
      setLessons(lessonsData);

      return { course: courseData, lessons: lessonsData };
    } catch (err) {
      setError(err.message || 'Failed to fetch course details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
  }, [fetchCourseDetail]);

  return {
    course,
    lessons,
    isLoading,
    error,
    refetch: fetchCourseDetail,
  };
};
