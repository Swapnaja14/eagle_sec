import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { quizzesAPI, submissionsAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

/**
 * Pulls /assessments/quizzes/{id}/, starts a submission, presents one question
 * at a time with selectable options, then submits all answers and completes.
 * Navigates to QuizResult with the final submission payload.
 */
export default function TakeAssessmentScreen({ navigation, route }) {
  const { quizId } = route.params || {};

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({}); // { quiz_question_id: selected }
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Load quiz metadata
        const q = await quizzesAPI.get(quizId);
        if (!mounted) return;
        setQuiz(q.data);

        // 2) Start a submission
        const startResp = await quizzesAPI.start(quizId);
        if (!mounted) return;
        setSubmission(startResp.data);

        // 3) Load quiz questions list (with order/points)
        const qList = await quizzesAPI.questions(quizId);
        if (!mounted) return;
        setQuestions(qList.data || []);
      } catch (e) {
        const msg = e?.response?.data?.error || 'Failed to start assessment.';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [quizId]);

  const total = questions.length;
  const current = questions[index];

  const onSelect = (qq, value) => {
    setAnswers((prev) => ({ ...prev, [qq.id]: value }));
  };

  const onSubmit = async () => {
    if (!submission || total === 0) return;

    // Confirm before submitting
    const unanswered = questions.filter((qq) => answers[qq.id] === undefined);
    if (unanswered.length) {
      Alert.alert(
        'Unanswered questions',
        `${unanswered.length} of ${total} unanswered. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: doSubmit },
        ]
      );
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      // Push each answer
      for (const qq of questions) {
        const sel = answers[qq.id];
        if (sel === undefined) continue;
        await submissionsAPI.submitAnswer(submission.id, {
          question_id: qq.question?.id,
          selected_answer: String(sel),
        });
      }
      // Complete + grade
      const complete = await submissionsAPI.complete(submission.id);
      navigation.replace('QuizResult', { submission: complete.data });
    } catch (e) {
      Alert.alert('Submission failed', e?.response?.data?.error || 'Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center', padding: spacing.lg }]}>
        <Text style={[typography.h2, { textAlign: 'center', marginBottom: spacing.md }]}>Cannot start</Text>
        <Text style={[typography.bodyMuted, { textAlign: 'center' }]}>{error}</Text>
        <TouchableOpacity style={[shared.primaryButton, { marginTop: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Text style={shared.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!total) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center', padding: spacing.lg }]}>
        <Text style={[typography.h2, { marginBottom: spacing.md }]}>No questions</Text>
        <Text style={[typography.bodyMuted, { textAlign: 'center' }]}>This quiz doesn't have any questions yet.</Text>
        <TouchableOpacity style={[shared.primaryButton, { marginTop: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Text style={shared.primaryButtonText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const choices = parseChoices(current?.question);

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{quiz?.title || 'Assessment'}</Text>
        <View style={styles.timer}>
          <Clock size={14} color={colors.text} />
          <Text style={styles.timerText}>{quiz?.time_limit_minutes || 30}m</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Question {index + 1} of {total}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={styles.qCard}>
          <Text style={styles.qLabel}>Q{index + 1}</Text>
          <Text style={styles.qText}>{current?.question?.text || '—'}</Text>
        </View>

        {choices.map((opt, i) => {
          const selected = answers[current.id] === opt.value;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSelect(current, opt.value)}
              style={[styles.option, selected && styles.optionActive]}
            >
              <View style={[styles.optionRadio, selected && styles.optionRadioActive]}>
                {selected && <CheckCircle2 size={14} color={colors.text} />}
              </View>
              <Text style={[styles.optionText, selected && { fontWeight: '700' }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          style={[styles.navBtn, index === 0 && { opacity: 0.4 }]}
        >
          <Text style={styles.navBtnText}>Previous</Text>
        </TouchableOpacity>

        {index < total - 1 ? (
          <TouchableOpacity onPress={() => setIndex((i) => Math.min(total - 1, i + 1))} style={styles.primary}>
            <Text style={styles.primaryText}>Next</Text>
            <ChevronRight size={18} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onSubmit} style={styles.primary} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Question.options can be JSON array, dict, or comma string. Normalize to {label,value}[].
function parseChoices(question) {
  if (!question) return [];
  const opts = question.options;
  if (Array.isArray(opts)) {
    return opts.map((o, i) => {
      if (typeof o === 'string') return { label: o, value: String(i) };
      if (o && typeof o === 'object') return { label: o.text ?? o.label ?? String(o.value ?? i), value: String(o.value ?? i) };
      return { label: String(o), value: String(i) };
    });
  }
  if (opts && typeof opts === 'object') {
    return Object.entries(opts).map(([k, v]) => ({ label: String(v), value: String(k) }));
  }
  if (typeof opts === 'string') {
    return opts.split(',').map((s, i) => ({ label: s.trim(), value: String(i) }));
  }
  // Fallback: True/False
  return [
    { label: 'True', value: 'true' },
    { label: 'False', value: 'false' },
  ];
}

const styles = StyleSheet.create({
  top: {
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
  topTitle: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center', marginHorizontal: spacing.md },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  timerText: { fontSize: 12, fontWeight: '700', color: colors.text, marginLeft: 4 },
  progressWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressBg: { height: 6, backgroundColor: colors.divider, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressText: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  qCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  qLabel: { fontSize: 11, fontWeight: '800', color: colors.textMuted, marginBottom: 6, letterSpacing: 0.6 },
  qText: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.cardSoft },
  optionRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionRadioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { flex: 1, fontSize: 14, color: colors.text },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  navBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    ...shadows.pill,
  },
  navBtnText: { fontWeight: '700', color: colors.text },
  primary: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  primaryText: { fontWeight: '800', color: colors.text, marginRight: 4 },
});
