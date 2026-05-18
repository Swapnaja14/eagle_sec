import apiClient from './client';
import { ENDPOINTS } from '../utils/constants';
import { baseURL } from '../services/api';

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
    console.error('[certificatesApi] Normalization error:', err);
    return [];
  }
};

/**
 * Certificates API endpoints with comprehensive error handling
 */
export const certificatesApi = {
  /**
   * Get my certificates
   */
  getMyCertificates: async (userId) => {
    try {
      if (!userId) throw new Error('User ID is required');
      
      const response = await apiClient.get(ENDPOINTS.MY_CERTIFICATES(userId));
      const data = response?.data || response;
      const normalized = normalizeResponse(data);
      
      console.log('[certificatesApi] Fetched certificates:', normalized.length);
      return normalized;
    } catch (err) {
      console.error('[certificatesApi] Get certificates error:', err);
      throw new Error(err?.message || 'Failed to fetch certificates');
    }
  },

  /**
   * Get certificate download URL
   */
  getCertificateUrl: (certificateId) => {
    if (!certificateId) return null;
    return `${baseURL}${ENDPOINTS.DOWNLOAD_CERTIFICATE(certificateId)}`;
  },

  /**
   * Download certificate PDF
   */
  downloadCertificate: async (certificateId) => {
    try {
      if (!certificateId) throw new Error('Certificate ID is required');
      
      const response = await apiClient.get(
        ENDPOINTS.DOWNLOAD_CERTIFICATE(certificateId),
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (err) {
      console.error('[certificatesApi] Download error:', err);
      throw new Error(err?.message || 'Failed to download certificate');
    }
  },
};
