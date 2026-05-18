import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, AlertCircle, BookOpen,
} from 'lucide-react-native';
import { useAssignments } from '../hooks/useAssignments';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function AssignmentsScreen({ navigation }) {
  const {
    assignments,
    isLoading,
    error,
    isRefreshing,
    refreshAssignments,
    completeAssignment,
  } = useAssignments(true);

  const [filter, setFilter] = useState('all'); // all, pending, completed

  const getFilteredAssignments = useCallback(() => {
    if (!Array.isArray(assignments)) return [];
    
    switch (filter) {
      case 'pending':
        return assignments.filter(a => a?.status === 'assigned' || a?.status === 'in_progress');
      case 'completed':
        return assignments.filter(a => a?.status === 'completed');
      default:
        return assignments;
    }
  }, [assignments, filter]);

  const handleCompleteAssignment = useCallback(async (assignmentId) => {
    try {
      Alert.alert(
        'Complete Assignment',
        'Mark this assignment as completed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                await completeAssignment(assignmentId);
                Alert.alert('Success', 'Assignment marked as completed!');
              } catch (err) {
                Alert.alert('Error', err?.message || 'Failed to complete assignment');
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('[AssignmentsScreen] Complete error:', err);
    }
  }, [completeAssignment]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Completed' };
      case 'in_progress':
        return { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' };
      case 'overdue':
        return { bg: '#FEE2E2', color: '#B91C1C', label: 'Overdue' };
      default:
        return { bg: colors.cardSoft, color: colors.text, label: 'Assigned' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const filteredAssignments = getFilteredAssignments();

  if (isLoading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} size="large" />
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>Loading assignments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Assignments</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({assignments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshAssignments} tintColor={colors.text} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={24} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refreshAssignments} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && filteredAssignments.length === 0 && (
          <View style={styles.empty}>
            <BookOpen size={48} color={colors.textMuted} />
            <Text style={[typography.h3, { marginTop: spacing.md }]}>
              {filter === 'all' ? 'No Assignments' : `No ${filter} Assignments`}
            </Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center' }]}>
              {filter === 'all'
                ? 'Your trainer will assign courses and materials here.'
                : `You don't have any ${filter} assignments.`}
            </Text>
          </View>
        )}

        {filteredAssignments.map((assignment, index) => {
          const badge = getStatusBadge(assignment?.status);
          return (
            <View key={assignment?.id || index} style={styles.assignmentCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseName} numberOfLines={1}>
                    {assignment?.course?.display_name || assignment?.course_name || 'Unnamed Course'}
                  </Text>
                  {assignment?.notes && (
                    <Text style={styles.notes} numberOfLines={2}>{assignment.notes}</Text>
                  )}
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>Due: {formatDate(assignment?.due_date)}</Text>
                </View>
                {assignment?.assigned_at && (
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      Assigned: {formatDate(assignment.assigned_at)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => {
                    if (assignment?.course?.id) {
                      navigation.navigate('CourseDetail', { courseId: assignment.course.id });
                    }
                  }}
                >
                  <Text style={styles.viewBtnText}>View Course</Text>
                </TouchableOpacity>
                {assignment?.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteAssignment(assignment?.id)}
                  >
                    <CheckCircle2 size={16} color={colors.text} />
                    <Text style={styles.completeBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.pill,
  },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.cardSoft,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: { color: '#B91C1C', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
  },
  retryText: { fontWeight: '700', color: colors.text },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  assignmentCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  courseName: { ...typography.h3, fontSize: 15, marginBottom: 4 },
  notes: { ...typography.bodyMuted, fontSize: 12, marginTop: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: 12, color: colors.textMuted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cardSoft,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  completeBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
});
