import { useState, useEffect, useCallback } from 'react';
import { assignmentsApi } from '../api/assignments.api';
import storageService from '../services/storageService';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Custom hook for managing assignments
 * Provides safe data handling with fallbacks and error recovery
 */
export const useAssignments = (autoFetch = true) => {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Safely normalize assignments data
   * Ensures we always have an array
   */
  const normalizeAssignments = useCallback((data) => {
    // Handle null, undefined, or non-array responses
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (typeof data === 'object') return [data];
    return [];
  }, []);

  // Fetch my assignments
  const fetchAssignments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await assignmentsApi.getMyAssignments();
      const normalizedData = normalizeAssignments(data);
      
      setAssignments(normalizedData);

      // Cache assignments data
      await storageService.cacheData(
        STORAGE_KEYS.CACHED_ASSIGNMENTS,
        normalizedData,
        60 // Cache for 60 minutes
      );

      return normalizedData;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch assignments';
      setError(errorMessage);
      console.error('[useAssignments] Fetch error:', err);

      // Try to load from cache on error
      try {
        const cachedAssignments = await storageService.getCachedData(
          STORAGE_KEYS.CACHED_ASSIGNMENTS
        );
        if (cachedAssignments && Array.isArray(cachedAssignments)) {
          setAssignments(cachedAssignments);
          console.log('[useAssignments] Loaded from cache');
        }
      } catch (cacheErr) {
        console.error('[useAssignments] Cache error:', cacheErr);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [normalizeAssignments]);

  // Refresh assignments
  const refreshAssignments = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await fetchAssignments();
    } catch (err) {
      console.error('[useAssignments] Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAssignments]);

  // Complete assignment
  const completeAssignment = useCallback(async (assignmentId) => {
    try {
      const result = await assignmentsApi.completeAssignment(assignmentId);
      
      // Update local state safely
      setAssignments((prev) => {
        if (!Array.isArray(prev)) return prev;
        
        return prev.map((assignment) =>
          assignment?.id === assignmentId
            ? { ...assignment, status: 'completed' }
            : assignment
        );
      });

      return result;
    } catch (err) {
      console.error('[useAssignments] Complete failed:', err);
      throw err;
    }
  }, []);

  // Get assignments by status with safe fallback
  const getAssignmentsByStatus = useCallback(
    (status) => {
      // Safely handle undefined/null assignments
      if (!Array.isArray(assignments)) return [];
      if (!status) return assignments;
      
      return assignments.filter((assignment) => assignment?.status === status) || [];
    },
    [assignments]
  );

  // Get pending assignments count with safe fallback
  const getPendingCount = useCallback(() => {
    if (!Array.isArray(assignments)) return 0;
    
    const count = assignments.filter(
      (a) => a?.status === 'assigned' || a?.status === 'in_progress'
    ).length;
    
    return count || 0;
  }, [assignments]);

  /**
   * Get completed assignments count
   */
  const getCompletedCount = useCallback(() => {
    if (!Array.isArray(assignments)) return 0;
    return assignments.filter((a) => a?.status === 'completed').length || 0;
  }, [assignments]);

  /**
   * Get all assignments safely
   */
  const getAllAssignments = useCallback(() => {
    return Array.isArray(assignments) ? assignments : [];
  }, [assignments]);

  // Load cached assignments on mount
  useEffect(() => {
    const loadCachedAssignments = async () => {
      try {
        const cachedAssignments = await storageService.getCachedData(
          STORAGE_KEYS.CACHED_ASSIGNMENTS
        );
        if (cachedAssignments && Array.isArray(cachedAssignments)) {
          setAssignments(cachedAssignments);
        }
      } catch (err) {
        console.error('[useAssignments] Failed to load cache:', err);
      }
    };

    loadCachedAssignments();

    if (autoFetch) {
      fetchAssignments();
    }
  }, [autoFetch, fetchAssignments]);

  return {
    assignments: Array.isArray(assignments) ? assignments : [],
    isLoading,
    error,
    isRefreshing,
    fetchAssignments,
    refreshAssignments,
    completeAssignment,
    getAssignmentsByStatus,
    getPendingCount,
    getCompletedCount,
    getAllAssignments,
  };
};
