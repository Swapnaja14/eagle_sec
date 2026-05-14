import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle, Award, Home, RotateCcw, Download } from 'lucide-react-native';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function QuizResultScreen({ navigation, route }) {
  const { submission } = route.params || {};
  const passed = !!submission?.passed;
  const pct = Math.round(submission?.percentage ?? 0);
  const score = submission?.score ?? 0;
  const total = submission?.total_points ?? 0;
  const cert = submission?.certificate;
  const time = submission?.time_taken_seconds || 0;
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* Result hero card */}
        <View style={[styles.hero, { backgroundColor: passed ? '#DCFCE7' : '#FEE2E2' }]}>
          <View style={[styles.heroIcon, { backgroundColor: passed ? '#22C55E' : '#EF4444' }]}>
            {passed ? <CheckCircle2 size={36} color="#fff" /> : <XCircle size={36} color="#fff" />}
          </View>
          <Text style={[styles.heroTitle, { color: passed ? '#15803D' : '#B91C1C' }]}>
            {passed ? 'Congratulations!' : 'Not quite there'}
          </Text>
          <Text style={styles.heroSub}>
            {passed
              ? 'You passed the assessment.'
              : 'You can re-attempt this assessment.'}
          </Text>
        </View>

        {/* Score circle */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{pct}%</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Stat label="Points earned" value={`${score} / ${total}`} />
            <Stat label="Time taken" value={`${minutes}m ${seconds}s`} />
            <Stat label="Status" value={passed ? 'Passed' : 'Failed'} />
          </View>
        </View>

        {/* Certificate */}
        {passed && cert ? (
          <View style={styles.certCard}>
            <View style={styles.certIcon}>
              <Award size={24} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.certTitle}>Certificate Earned</Text>
              <Text style={styles.certSub}>{cert.course_title || 'Course completion'}</Text>
            </View>
            <TouchableOpacity
              style={styles.dlBtn}
              onPress={() => cert.download_url && Linking.openURL(cert.download_url)}
            >
              <Download size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Per-question breakdown */}
        {Array.isArray(submission?.answers) && submission.answers.length > 0 && (
          <>
            <Text style={[shared.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Question Breakdown
            </Text>
            {submission.answers.map((a, i) => (
              <View key={a.id || i} style={styles.aCard}>
                <View style={styles.aHeader}>
                  <Text style={styles.aIndex}>Q{i + 1}</Text>
                  {a.is_correct ? (
                    <View style={[styles.aBadge, { backgroundColor: '#DCFCE7' }]}>
                      <CheckCircle2 size={12} color="#15803D" />
                      <Text style={[styles.aBadgeText, { color: '#15803D' }]}>+{a.points_earned}</Text>
                    </View>
                  ) : (
                    <View style={[styles.aBadge, { backgroundColor: '#FEE2E2' }]}>
                      <XCircle size={12} color="#B91C1C" />
                      <Text style={[styles.aBadgeText, { color: '#B91C1C' }]}>0</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.aQuestion} numberOfLines={2}>{a.question_text || `Question ${i + 1}`}</Text>
                <Text style={styles.aAnswer}>Your answer: {String(a.selected_answer ?? '—')}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.secondary}
        >
          <Home size={16} color={colors.text} />
          <Text style={styles.secondaryText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.replace('TakeAssessment', { quizId: submission?.quiz?.id })}
          style={styles.primary}
        >
          <RotateCcw size={16} color={colors.text} />
          <Text style={styles.primaryText}>Retake</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: { fontSize: 22, fontWeight: '800' },
  heroSub: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  scoreCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  scoreLabel: { fontSize: 11, color: colors.text, fontWeight: '600' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statLabel: { fontSize: 13, color: colors.textMuted },
  statValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  certIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  certTitle: { fontWeight: '800', color: colors.text, fontSize: 15 },
  certSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dlBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  aCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.pill,
  },
  aHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  aIndex: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  aBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  aBadgeText: { fontSize: 11, fontWeight: '800', marginLeft: 4 },
  aQuestion: { fontSize: 13, fontWeight: '600', color: colors.text },
  aAnswer: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  secondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.card,
    paddingVertical: 14, borderRadius: radius.pill,
    ...shadows.pill,
  },
  secondaryText: { fontWeight: '700', color: colors.text, marginLeft: 6 },
  primary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: radius.pill,
  },
  primaryText: { fontWeight: '800', color: colors.text, marginLeft: 6 },
});
