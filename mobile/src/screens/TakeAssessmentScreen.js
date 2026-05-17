import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Clock3,
  CircleCheck,
  Circle,
  ChevronRight,
} from 'lucide-react-native';

import { assessmentsAPI } from '../services/api';

import {
  colors,
  spacing,
  radius,
  typography,
  shared,
  shadows,
} from '../theme';

export default function TakeAssessment({
  navigation,
  route,
}) {
  const assessmentId = route?.params?.assessmentId;

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    loadAssessment();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadAssessment = async () => {
    try {
      setLoading(true);

      const res = await assessmentsAPI.getById(
        assessmentId
      );

      const data = res.data;

      setAssessment(data);

      const qs = data.questions || [];

      setQuestions(qs);

      const duration =
        (data.time_limit || 15) * 60;

      setTimeLeft(duration);
    } catch (e) {
      console.log(
        'Assessment load failed',
        e?.message
      );

      Alert.alert(
        'Error',
        'Failed to load assessment.'
      );

      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion =
    questions[currentIndex];

  const progress = useMemo(() => {
    if (!questions.length) return 0;

    return (
      ((currentIndex + 1) / questions.length) *
      100
    );
  }, [currentIndex, questions]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;

    return `${mins}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const selectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const submitAssessment = async () => {
    try {
      setSubmitting(true);

      const payload = {
        assessment: assessmentId,
        answers,
      };

      const res =
        await assessmentsAPI.submitAssessment(
          payload
        );

      Alert.alert(
        'Assessment Submitted',
        `Score: ${res.data.score}%`,
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate(
                'AssessmentResult',
                {
                  result: res.data,
                }
              ),
          },
        ]
      );
    } catch (e) {
      console.log(
        'Submit failed',
        e?.message
      );

      Alert.alert(
        'Error',
        'Failed to submit assessment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to submit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          onPress: submitAssessment,
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          shared.screen,
          styles.center,
        ]}
      >
        <ActivityIndicator
          color={colors.text}
        />
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView
        style={[
          shared.screen,
          styles.center,
        ]}
      >
        <Text>No questions found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={shared.screen}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {assessment?.title ||
                'Assessment'}
            </Text>

            <Text style={styles.subtitle}>
              Question {currentIndex + 1} of{' '}
              {questions.length}
            </Text>
          </View>

          <View style={styles.timerBox}>
            <Clock3
              size={16}
              color={colors.text}
            />

            <Text style={styles.timerText}>
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map(
              (option, index) => {
                const selected =
                  answers[
                    currentQuestion.id
                  ] === option;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      selected &&
                        styles.optionSelected,
                    ]}
                    onPress={() =>
                      selectOption(
                        currentQuestion.id,
                        option
                      )
                    }
                  >
                    <View
                      style={
                        styles.optionIcon
                      }
                    >
                      {selected ? (
                        <CircleCheck
                          size={20}
                          color={
                            colors.primary
                          }
                        />
                      ) : (
                        <Circle
                          size={20}
                          color={
                            colors.textMuted
                          }
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.optionText,
                        selected && {
                          color:
                            colors.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              currentIndex === 0 &&
                styles.disabledBtn,
            ]}
            disabled={currentIndex === 0}
            onPress={prevQuestion}
          >
            <Text style={styles.navBtnText}>
              Previous
            </Text>
          </TouchableOpacity>

          {currentIndex ===
          questions.length - 1 ? (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={confirmSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator
                  color="#fff"
                />
              ) : (
                <Text
                  style={
                    styles.submitBtnText
                  }
                >
                  Submit
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={nextQuestion}
            >
              <Text style={styles.nextBtnText}>
                Next
              </Text>

              <ChevronRight
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.h2,
    fontSize: 22,
  },

  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
  },

  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    gap: 6,
    ...shadows.pill,
  },

  timerText: {
    fontWeight: '700',
    color: colors.text,
  },

  progressBar: {
    height: 10,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },

  questionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },

  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
    lineHeight: 30,
  },

  optionsContainer: {
    gap: spacing.md,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.cardSoft,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FEF3C7',
  },

  optionIcon: {
    marginRight: spacing.md,
  },

  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  navBtn: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.pill,
  },

  navBtnText: {
    fontWeight: '700',
    color: colors.text,
  },

  disabledBtn: {
    opacity: 0.5,
  },

  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.card,
  },

  nextBtnText: {
    fontWeight: '700',
    color: '#fff',
  },

  submitBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});