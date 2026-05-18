import apiClient from './client';
import { ENDPOINTS } from '../utils/constants';

/**
 * Assessments/Quizzes API endpoints
 */
export const assessmentsApi = {
  /**
   * Get all quizzes
   */
  getQuizzes: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.QUIZZES, { params });
    return response.data;
  },

  /**
   * Get quiz detail
   */
  getQuizDetail: async (quizId) => {
    const response = await apiClient.get(ENDPOINTS.QUIZ_DETAIL(quizId));
    return response.data;
  },

  /**
   * Start a new quiz attempt
   */
  startQuiz: async (quizId) => {
    const response = await apiClient.post(ENDPOINTS.START_QUIZ(quizId));
    return response.data;
  },

  /**
   * Get quiz questions
   */
  getQuizQuestions: async (quizId) => {
    const response = await apiClient.get(ENDPOINTS.QUIZ_QUESTIONS(quizId));
    return response.data;
  },

  /**
   * Get my submissions
   */
  getMySubmissions: async () => {
    const response = await apiClient.get(`${ENDPOINTS.SUBMISSIONS}my_submissions/`);
    return response.data;
  },

  /**
   * Submit answer for a question
   */
  submitAnswer: async (submissionId, questionId, selectedAnswer) => {
    const response = await apiClient.post(
      ENDPOINTS.SUBMIT_ANSWER(submissionId),
      {
        question_id: questionId,
        selected_answer: selectedAnswer,
      }
    );
    return response.data;
  },

  /**
   * Complete and submit quiz
   */
  completeSubmission: async (submissionId) => {
    const response = await apiClient.post(
      ENDPOINTS.COMPLETE_SUBMISSION(submissionId)
    );
    return response.data;
  },
};
