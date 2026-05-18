import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useCourses } from '../../hooks/useCourses';
import { useAssignments } from '../../hooks/useAssignments';
import { COLORS, SPACING } from '../../utils/constants';

/**
 * Dashboard Screen with complete error handling and loading states
 * Prevents white screen crashes and handles all edge cases
 */
export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { 
    courses = [], 
    isLoading: coursesLoading = false, 
    error: coursesError = null,
    refreshCourses = async () => {},
    isRefreshing: coursesRefreshing = false 
  } = useCourses() || {};

  const { 
    assignments = [], 
    getPendingCount = () => 0,
    refreshAssignments = async () => {},
    error: assignmentsError = null,
    isLoading: assignmentsLoading = false,
    isRefreshing: assignmentsRefreshing = false
  } = useAssignments() || {};

  // Safely get values with fallbacks
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safePendingCount = typeof getPendingCount === 'function' ? getPendingCount() : 0;

  const recentCourses = safeCourses.slice(0, 3);
  const recentAssignments = safeAssignments.slice(0, 3);

  const isRefreshing = coursesRefreshing || assignmentsRefreshing;
  const isLoading = coursesLoading || assignmentsLoading;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refreshCourses?.().catch(err => console.error('Refresh courses error:', err)),
        refreshAssignments?.().catch(err => console.error('Refresh assignments error:', err)),
      ]);
    } catch (err) {
      console.error('[DashboardScreen] Refresh error:', err);
    }
  };

  // Safe user name fallback
  const displayName = user?.first_name || user?.username || 'Learner';

  // Error message display
  const hasErrors = coursesError || assignmentsError;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {displayName}!</Text>
        <Text style={styles.subtitle}>Welcome back to learning</Text>
      </View>

      {/* Error Alert */}
      {hasErrors && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            ⚠️ {coursesError || assignmentsError}
          </Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.statNumber}>{safeCourses.length}</Text>
          <Text style={styles.statLabel}>Available Courses</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
          <Text style={styles.statNumber}>{safePendingCount}</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </View>
      </View>

      {/* Recent Courses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Courses</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Courses')}
            disabled={coursesLoading}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {coursesLoading && recentCourses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading courses...</Text>
          </View>
        ) : recentCourses.length > 0 ? (
          recentCourses.map((course) => (
            <TouchableOpacity
              key={course?.id}
              style={styles.courseCard}
              onPress={() =>
                course?.id && navigation.navigate('CourseDetail', { courseId: course.id })
              }
            >
              <View style={styles.courseHeader}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course?.display_name || 'Untitled Course'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        course?.status === 'active'
                          ? COLORS.success
                          : COLORS.textSecondary,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>{course?.status || 'unknown'}</Text>
                </View>
              </View>
              <Text style={styles.courseDescription} numberOfLines={2}>
                {course?.description || 'No description available'}
              </Text>
              <Text style={styles.courseMeta}>
                {course?.lesson_count || 0} Lessons
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No courses available</Text>
        )}
      </View>

      {/* Recent Assignments Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Assignments</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Assignments')}
            disabled={assignmentsLoading}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {assignmentsLoading && recentAssignments.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : recentAssignments.length > 0 ? (
          recentAssignments.map((assignment) => {
            try {
              return (
                <TouchableOpacity
                  key={assignment?.id}
                  style={styles.assignmentCard}
                  onPress={() =>
                    assignment?.id &&
                    navigation.navigate('AssignmentDetail', {
                      assignmentId: assignment.id,
                    })
                  }
                >
                  <Text style={styles.assignmentTitle} numberOfLines={1}>
                    {assignment?.course_title || assignment?.title || 'Untitled Assignment'}
                  </Text>
                  <View style={styles.assignmentFooter}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            assignment?.status === 'completed'
                              ? COLORS.success
                              : assignment?.status === 'in_progress'
                              ? COLORS.info
                              : COLORS.warning,
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {assignment?.status || 'pending'}
                      </Text>
                    </View>
                    {assignment?.due_date && (
                      <Text style={styles.dueDate}>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            } catch (err) {
              console.error('[DashboardScreen] Render assignment error:', err);
              return null;
            }
          })
        ) : (
          <Text style={styles.emptyText}>No assignments yet</Text>
        )}
      </View>

      {/* Initial Loading State */}
      {isLoading && recentCourses.length === 0 && recentAssignments.length === 0 && (
        <View style={styles.fullLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing dashboard...</Text>
        </View>
      )}
    </ScrollView>
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
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  errorBanner: {
    backgroundColor: '#fee',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.warning,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '500',
    marginRight: SPACING.sm,
  },
  retryText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  courseDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  courseMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  assignmentCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dueDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  fullLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
