import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { useAssignments } from '../../hooks/useAssignments';
import { COLORS, SPACING, ASSIGNMENT_STATUS } from '../../utils/constants';

const { width } = Dimensions.get('window');

/**
 * Assignments Screen - Complete trainee assignment management
 * Features:
 * - View all assignments with filtering by status
 * - Track completion progress
 * - Submit completed assignments
 * - View assignment details and due dates
 * - Pull-to-refresh functionality
 * - Error handling and retry
 */
export const AssignmentsScreen = ({ navigation }) => {
  const {
    assignments = [],
    isLoading = false,
    error = null,
    isRefreshing = false,
    refreshAssignments = async () => {},
    completeAssignment = async () => {},
    getAssignmentsByStatus = () => [],
    getPendingCount = () => 0,
    getCompletedCount = () => 0,
  } = useAssignments() || {};

  const [filterStatus, setFilterStatus] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  // Safely normalize arrays
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const pendingCount = typeof getPendingCount === 'function' ? getPendingCount() : 0;
  const completedCount = typeof getCompletedCount === 'function' ? getCompletedCount() : 0;

  // Filter assignments based on selected status
  const filteredAssignments = useMemo(() => {
    if (!filterStatus) return safeAssignments;
    
    if (typeof getAssignmentsByStatus === 'function') {
      return getAssignmentsByStatus(filterStatus);
    }
    
    return safeAssignments.filter((a) => a?.status === filterStatus);
  }, [filterStatus, safeAssignments, getAssignmentsByStatus]);

  const handleRefresh = async () => {
    try {
      await refreshAssignments?.();
    } catch (err) {
      console.error('[AssignmentsScreen] Refresh error:', err);
    }
  };

  const handleCompleteAssignment = async (assignmentId) => {
    try {
      setSubmittingId(assignmentId);
      await completeAssignment?.(assignmentId);
    } catch (err) {
      console.error('[AssignmentsScreen] Complete error:', err);
    } finally {
      setSubmittingId(null);
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

  const getStatusLabel = (status) => {
    switch (status) {
      case ASSIGNMENT_STATUS.COMPLETED:
        return '✓ Completed';
      case ASSIGNMENT_STATUS.IN_PROGRESS:
        return '⟳ In Progress';
      case ASSIGNMENT_STATUS.OVERDUE:
        return '⚠️ Overdue';
      case ASSIGNMENT_STATUS.ASSIGNED:
      default:
        return '○ Assigned';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const daysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };

  const renderAssignmentCard = ({ item: assignment }) => {
    if (!assignment?.id) return null;

    const isSubmitting = submittingId === assignment.id;
    const overdue = isOverdue(assignment.due_date);
    const daysLeft = daysUntilDue(assignment.due_date);
    const statusColor = getStatusColor(assignment.status);
    const isCompleted = assignment.status === ASSIGNMENT_STATUS.COMPLETED;

    return (
      <TouchableOpacity
        style={styles.assignmentCard}
        onPress={() =>
          navigation.navigate('AssignmentDetail', {
            assignmentId: assignment.id,
          })
        }
        disabled={isSubmitting}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {assignment.course_title || assignment.title || 'Untitled'}
            </Text>
            <Text style={styles.assignmentDescription} numberOfLines={1}>
              {assignment.description || assignment.instructions || 'No description'}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusText}>{getStatusLabel(assignment.status)}</Text>
          </View>
        </View>

        {/* Body - Assignment Details */}
        <View style={styles.cardBody}>
          {assignment.due_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={[
                styles.detailValue,
                overdue && { color: COLORS.error },
              ]}>
                {new Date(assignment.due_date).toLocaleDateString()}
              </Text>
              {!isCompleted && daysLeft !== null && (
                <Text style={[
                  styles.daysLeft,
                  daysLeft <= 1 && { color: COLORS.error },
                  daysLeft <= 3 && { color: COLORS.warning },
                ]}>
                  {daysLeft === 0 ? 'Today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                </Text>
              )}
            </View>
          )}

          {assignment.submission_count !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submissions:</Text>
              <Text style={styles.detailValue}>{assignment.submission_count || 0}</Text>
            </View>
          )}

          {assignment.marks !== undefined && !isNaN(assignment.marks) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Score:</Text>
              <Text style={styles.detailValue}>{assignment.marks}/{assignment.total_marks || 100}</Text>
            </View>
          )}
        </View>

        {/* Footer - Actions */}
        <View style={styles.cardFooter}>
          {!isCompleted && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && { opacity: 0.6 },
              ]}
              onPress={() => handleCompleteAssignment(assignment.id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <Text style={styles.submitButtonText}>
                  {assignment.status === ASSIGNMENT_STATUS.IN_PROGRESS ? 'Submit' : 'Start'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              navigation.navigate('AssignmentDetail', {
                assignmentId: assignment.id,
              })
            }
          >
            <Text style={styles.detailsButtonText}>Details →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Tabs for filtering
  const filterTabs = [
    { label: 'All', value: null, count: safeAssignments.length },
    { label: 'Pending', value: ASSIGNMENT_STATUS.ASSIGNED, count: pendingCount },
    { label: 'In Progress', value: ASSIGNMENT_STATUS.IN_PROGRESS, count: safeAssignments.filter((a) => a?.status === ASSIGNMENT_STATUS.IN_PROGRESS).length },
    { label: 'Completed', value: ASSIGNMENT_STATUS.COMPLETED, count: completedCount },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Assignments</Text>
        <Text style={styles.headerSubtitle}>Track your learning progress</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{safeAssignments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber} style={{ color: COLORS.warning }}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber} style={{ color: COLORS.success }}>
            {completedCount}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Error Alert */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.value || 'all'}
            style={[
              styles.tab,
              filterStatus === tab.value && styles.tabActive,
            ]}
            onPress={() => setFilterStatus(tab.value)}
          >
            <Text
              style={[
                styles.tabText,
                filterStatus === tab.value && styles.tabTextActive,
              ]}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Assignments List */}
      {isLoading && safeAssignments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      ) : filteredAssignments.length > 0 ? (
        <FlatList
          data={filteredAssignments}
          renderItem={renderAssignmentCard}
          keyExtractor={(item) => `${item?.id || Math.random()}`}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {filterStatus ? 'No assignments found' : 'No assignments yet'}
          </Text>
          <Text style={styles.emptyText}>
            {filterStatus
              ? `No ${filterStatus.replace('_', ' ').toLowerCase()} assignments`
              : 'Check back later for new assignments'}
          </Text>
          {filterStatus && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => setFilterStatus(null)}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Scroll Wrapper for Pull-to-Refresh */}
      {filteredAssignments.length === 0 && !isLoading && (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  errorBanner: {
    backgroundColor: '#fee',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.warning,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '500',
  },
  retryText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  tabsContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  assignmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    flex: 1,
  },
  assignmentDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    marginLeft: SPACING.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  daysLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  cardFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  clearFilterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
});
