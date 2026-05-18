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
    console.error('[assignmentsApi] Normalization error:', err);
    return [];
  }
};

/**
 * Assignments API endpoints with comprehensive error handling
 */
export const assignmentsApi = {
  /**
   * Get my assignments (trainee only)
   * Returns guaranteed array or empty array
   */
  getMyAssignments: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.MY_ASSIGNMENTS);
      
      // Handle different response formats
      const data = response?.data || response;
      const normalized = normalizeResponse(data);
      
      // Enrich assignments with course data
      const enriched = normalized.map(assignment => ({
        ...assignment,
        course: assignment.course || {
          id: assignment.course_id,
          display_name: assignment.course_title || 'Unnamed Course',
        },
        course_name: assignment.course_title || assignment.course?.display_name || 'Unnamed Course',
      }));
      
      console.log('[assignmentsApi] Fetched assignments:', enriched.length);
      return enriched;
    } catch (err) {
      console.error('[assignmentsApi] Get assignments error:', err);
      throw new Error(err?.message || 'Failed to fetch assignments');
    }
  },

  /**
   * Get assignment detail
   */
  getAssignmentDetail: async (assignmentId) => {
    try {
      if (!assignmentId) throw new Error('Assignment ID is required');
      
      const response = await apiClient.get(`${ENDPOINTS.ASSIGNMENTS}${assignmentId}/`);
      const data = response?.data || response;
      
      if (!data) throw new Error('No assignment data returned');
      
      return data;
    } catch (err) {
      console.error('[assignmentsApi] Get detail error:', err);
      throw new Error(err?.message || 'Failed to fetch assignment details');
    }
  },

  /**
   * Complete assignment and get certificate
   */
  completeAssignment: async (assignmentId) => {
    try {
      if (!assignmentId) throw new Error('Assignment ID is required');
      
      const response = await apiClient.post(ENDPOINTS.COMPLETE_ASSIGNMENT(assignmentId));
      const data = response?.data || response;
      
      if (!data) throw new Error('No response data');
      
      console.log('[assignmentsApi] Assignment completed:', assignmentId);
      return data;
    } catch (err) {
      console.error('[assignmentsApi] Complete error:', err);
      throw new Error(err?.message || 'Failed to complete assignment');
    }
  },
};
