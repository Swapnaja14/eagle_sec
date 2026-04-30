import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Heart, Star, Clock, BookOpen, Award, Play, ChevronRight,
} from 'lucide-react-native';
import { coursesAPI, assessmentsAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

const COVER = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900';

export default function CourseDetailScreen({ navigation, route }) {
  const { courseId } = route.params || {};
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, q] = await Promise.all([
          coursesAPI.get(courseId).catch(() => null),
          assessmentsAPI.list({ course: courseId }).catch(() => ({ data: { results: [] } })),
        ]);
        if (!mounted) return;
        if (c) setCourse(c.data);
        const list = q.data?.results || q.data || [];
        setQuizzes(list);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId]);

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={typography.bodyMuted}>Course not found.</Text>
      </SafeAreaView>
    );
  }

  const lessons = course.lesson_count ?? quizzes.length ?? 0;
  const level = course.skills_taxonomy && course.skills_taxonomy !== 'none' ? course.skills_taxonomy : 'Standard';

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Yellow header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Course Details</Text>
        <TouchableOpacity onPress={() => setFavorited((v) => !v)} style={styles.iconBtn}>
          <Heart
            size={20}
            color={favorited ? colors.danger : colors.text}
            fill={favorited ? colors.danger : 'none'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Image source={{ uri: COVER }} style={styles.cover} />

        <View style={styles.body}>
          <Text style={styles.title}>{course.display_name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.author}>by {course.created_by_name || 'EagleSec'}</Text>
            <View style={styles.rating}>
              <Star size={14} color={colors.star} fill={colors.star} />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.ratingCount}>(200 reviews)</Text>
            </View>
          </View>

          <Text style={styles.desc}>
            {course.description ||
              'Start your journey into modern security training. This course covers core concepts, practical compliance scenarios, and hands-on assessment to help you reach proficiency.'}
          </Text>

          {/* Three stat boxes */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Clock size={20} color={colors.text} />
              <Text style={styles.statValue}>{lessons * 10 || 30} mins</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.stat}>
              <BookOpen size={20} color={colors.text} />
              <Text style={styles.statValue}>{lessons} Lessons</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>
            <View style={styles.stat}>
              <Award size={20} color={colors.text} />
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          {/* Assessments / quizzes list */}
          <Text style={[shared.sectionTitle, { marginTop: spacing.xl }]}>Assessments</Text>
          {quizzes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={typography.bodyMuted}>No assessments published for this course yet.</Text>
            </View>
          ) : (
            quizzes.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={styles.quizRow}
                onPress={() => navigation.navigate('TakeAssessment', { quizId: q.id })}
              >
                <View style={styles.quizIcon}>
                  <Play size={18} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizTitle} numberOfLines={1}>{q.title}</Text>
                  <Text style={styles.quizSub}>
                    {q.total_questions || 0} questions • Pass {q.passing_score}%
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA at bottom */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => {
            if (quizzes[0]) navigation.navigate('TakeAssessment', { quizId: quizzes[0].id });
          }}
          disabled={!quizzes[0]}
        >
          <Text style={styles.ctaText}>
            {quizzes[0] ? 'Start Assessment' : 'No Assessment Available'}
          </Text>
          <ChevronRight size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
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
  cover: {
    width: '100%',
    height: 220,
    marginTop: -10,
    backgroundColor: colors.cardSoft,
  },
  body: { padding: spacing.lg },
  title: { ...typography.h1, fontSize: 22, marginBottom: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  author: { color: colors.textMuted, fontSize: 13 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontWeight: '700', color: colors.text, marginLeft: 4 },
  ratingCount: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  desc: { ...typography.body, color: '#333', lineHeight: 22 },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.pill,
  },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    ...shadows.pill,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadows.pill,
  },
  quizIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  quizTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  quizSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.pill,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: colors.text, marginRight: 6 },
});
