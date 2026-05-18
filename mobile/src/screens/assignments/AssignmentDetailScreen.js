import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Share,
} from 'react-native';
import { assignmentsApi } from '../../api/assignments.api';
import { COLORS, SPACING, ASSIGNMENT_STATUS } from '../../utils/constants';

/**
 * Assignment Detail Screen
 * Displays full assignment details with submission capability
 */
export const AssignmentDetailScreen = ({ route, navigation }) => {
  const { assignmentId } = route?.params || {};

  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      setError('Assignment ID not provided');
      setIsLoading(false);
      return;
    }

    fetchAssignmentDetail();
  }, [assignmentId]);

  const fetchAssignmentDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await assignmentsApi.getAssignmentDetail(assignmentId);

      // Normalize data
      if (!data) {
        throw new Error('No assignment data returned');
      }

      setAssignment(data);
    } catch (err) {
      console.error('[AssignmentDetailScreen] Fetch error:', err);
      setError(err?.message || 'Failed to load assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignment?.id) {
      Alert.alert('Error', 'Cannot submit: Assignment data is missing');
      return;
    }

    Alert.alert('Submit Assignment', 'Are you sure you want to submit this assignment?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            const result = await assignmentsApi.completeAssignment(assignment.id);

            Alert.alert('Success', 'Assignment submitted successfully!', [
              {
                text: 'OK',
                onPress: () => {
                  setAssignment({ ...assignment, status: ASSIGNMENT_STATUS.COMPLETED });
                  navigation.goBack();
                },
              },
            ]);
          } catch (err) {
            Alert.alert('Error', err?.message || 'Failed to submit assignment');
            console.error('[AssignmentDetailScreen] Submit error:', err);
          } finally {
            setIsSubmitting(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this assignment: ${assignment?.title || assignment?.course_title}`,
        title: 'Share Assignment',
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ASSIGNMENT_STATUS.COMPLETED:
        return COLORS.success;
      case ASSIGNMENT_STATUS.IN_PROGRESS:
        return COLORS.info;
      case ASSIGNMENT_STATUS.OVERDUE:
        return COLORS.error;
      case ASSIGNMENT_STATUS.ASSIGNED:
      default:
        return COLORS.warning;
    }
  };

  const isOverdue = assignment?.due_date && new Date(assignment.due_date) < new Date();
  const isCompleted = assignment?.status === ASSIGNMENT_STATUS.COMPLETED;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading assignment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !assignment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error || 'Assignment not found'}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAssignmentDetail}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Assignment Details
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Text style={styles.shareIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Assignment Title */}
        <View style={styles.titleSection}>
          <Text style={styles.courseTitle}>
            {assignment?.course_title || assignment?.title || 'Untitled'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(assignment?.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {assignment?.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
            </Text>
          </View>
        </View>

        {/* Critical Info */}
        {(assignment?.due_date || isOverdue) && (
          <View style={[styles.infoBox, isOverdue && styles.infoBoxOverdue]}>
            <Text style={styles.infoLabel}>
              {isOverdue ? '⚠️ OVERDUE' : '📅 Due Date'}
            </Text>
            <Text style={[styles.infoValue, isOverdue && { color: COLORS.error }]}>
              {new Date(assignment.due_date).toLocaleDateString()} at{' '}
              {new Date(assignment.due_date).toLocaleTimeString()}
            </Text>
          </View>
        )}

        {/* Description */}
        {assignment?.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>
              {assignment.description}
            </Text>
          </View>
        )}

        {/* Instructions */}
        {assignment?.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Text style={styles.sectionContent}>
              {assignment.instructions}
            </Text>
          </View>
        )}

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {assignment?.submission_count !== undefined && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>Submissions</Text>
              <Text style={styles.detailCardValue}>
                {assignment.submission_count || 0}
              </Text>
            </View>
          )}

          {assignment?.marks !== undefined && !isNaN(assignment.marks) && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>Score</Text>
              <Text style={styles.detailCardValue}>
                {assignment.marks}/{assignment.total_marks || 100}
              </Text>
            </View>
          )}

          {assignment?.total_marks && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>Total Marks</Text>
              <Text style={styles.detailCardValue}>
                {assignment.total_marks}
              </Text>
            </View>
          )}

          {assignment?.passing_marks && (
            <View style={styles.detailCard}>
              <Text style={styles.detailCardLabel}>Passing Marks</Text>
              <Text style={styles.detailCardValue}>
                {assignment.passing_marks}
              </Text>
            </View>
          )}
        </View>

        {/* Attachments */}
        {assignment?.attachments && Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            {assignment.attachments.map((attachment, index) => (
              <TouchableOpacity key={index} style={styles.attachmentItem}>
                <Text style={styles.attachmentIcon}>📎</Text>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment?.name || attachment?.title || `File ${index + 1}`}
                </Text>
                <Text style={styles.attachmentSize}>
                  {attachment?.size || 'Unknown'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Submission History */}
        {assignment?.submissions && Array.isArray(assignment.submissions) && assignment.submissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submissions</Text>
            {assignment.submissions.map((submission, index) => (
              <View key={index} style={styles.submissionItem}>
                <View style={styles.submissionHeader}>
                  <Text style={styles.submissionDate}>
                    {new Date(submission?.submitted_at || submission?.date).toLocaleDateString()}
                  </Text>
                  <View
                    style={[
                      styles.submissionStatus,
                      {
                        backgroundColor:
                          submission?.status === 'graded'
                            ? COLORS.success
                            : COLORS.info,
                      },
                    ]}
                  >
                    <Text style={styles.submissionStatusText}>
                      {submission?.status || 'Pending'}
                    </Text>
                  </View>
                </View>
                {submission?.score !== undefined && (
                  <Text style={styles.submissionScore}>
                    Score: {submission.score}/{assignment.total_marks || 100}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Notes/Feedback */}
        {assignment?.feedback && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>{assignment.feedback}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!isCompleted && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitAssignment}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>
                {assignment?.status === ASSIGNMENT_STATUS.IN_PROGRESS
                  ? '✓ Submit Assignment'
                  : '▶ Start Assignment'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backIconButton: {
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
  shareButton: {
    padding: SPACING.sm,
  },
  shareIcon: {
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  courseTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  infoBoxOverdue: {
    borderLeftColor: COLORS.error,
    backgroundColor: '#fee',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  detailCardLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  detailCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attachmentIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  attachmentSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  submissionItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  submissionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  submissionStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  submissionStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  submissionScore: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  feedbackBox: {
    backgroundColor: '#fffde7',
    borderLeftWidth: 4,
    borderLeftColor: '#fbc02d',
    padding: SPACING.md,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
