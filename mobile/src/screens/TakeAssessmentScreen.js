import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Clock, Calendar, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { dashboardAPI, assessmentsAPI } from '../services/api';

const { width } = Dimensions.get('window');

export default function TakeAssessmentScreen({ navigation, route }) {
  const [phase, setPhase] = useState('list');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (phase === 'list') {
      loadPendingQuizzes();
    }
  }, [phase]);

  const loadPendingQuizzes = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getTraineeOverview();
      setQuizzes(res.data.pending_assessments || []);
    } catch (e) {
      console.log('Failed to fetch quizzes', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (quiz) => {
    try {
      setLoading(true);
      // Start quiz to get submission
      const subRes = await assessmentsAPI.startQuiz(quiz.id);
      const sub = subRes.data;
      
      // Get questions
      const qRes = await assessmentsAPI.getQuestions(quiz.id);
      
      setSelectedQuiz(quiz);
      setSubmission(sub);
      setQuestions(qRes.data);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(quiz.timeLimit * 60);
      setPhase('quiz');
    } catch (e) {
      console.log('Failed to start quiz', e);
      alert('Could not start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const res = await assessmentsAPI.completeSubmission(submission.id);
      setResultData(res.data);
      setPhase('result');
    } catch (e) {
      console.log('Failed to submit quiz', e);
      alert('Submission failed.');
    } finally {
      setLoading(false);
    }
  }, [submission]);

  useEffect(() => {
    if (phase !== 'quiz') return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, handleSubmit]);

  const selectAnswer = async (qIndex, optionIndex, optionText) => {
    setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    const question = questions[qIndex];
    try {
      await assessmentsAPI.submitAnswer(submission.id, {
        question_id: question.question.id,
        selected_answer: optionText
      });
    } catch (e) {
      console.log('Failed to save answer', e);
    }
  };

  const formatTime = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  if (loading && phase === 'list') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
        <Text style={{color: '#fff', textAlign: 'center', marginTop: 100}}>Loading...</Text>
      </View>
    );
  }

  // LIST PHASE
  if (phase === 'list') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Take Assessment</Text>
              <Text style={styles.headerDesc}>Complete pending assessments</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {quizzes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{fontSize: 40, marginBottom: 10}}>🎉</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyDesc}>No pending assessments at the moment.</Text>
              </View>
            ) : quizzes.map(quiz => (
              <BlurView intensity={30} tint="dark" style={styles.quizCard} key={quiz.id}>
                <View style={styles.quizCardHeader}>
                  <View style={styles.iconBox}><FileText color="#3b82f6" size={20} /></View>
                  <Text style={styles.quizTitle} numberOfLines={2}>{quiz.module}</Text>
                </View>
                <View style={styles.quizMetaRow}>
                  <Text style={styles.quizMetaText}>📋 {quiz.questions} Qs</Text>
                  <Text style={styles.quizMetaText}>⏱️ {quiz.timeLimit} mins</Text>
                </View>
                <TouchableOpacity style={styles.startBtn} onPress={() => handleStart(quiz)}>
                  <Text style={styles.startBtnText}>Start Now →</Text>
                </TouchableOpacity>
              </BlurView>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // QUIZ PHASE
  if (phase === 'quiz' && questions.length > 0) {
    const qObj = questions[currentQ];
    const qDetails = qObj.question;
    // Safety check if options exists, parse if string
    let options = [];
    if (qDetails.options) {
      options = typeof qDetails.options === 'string' ? JSON.parse(qDetails.options) : qDetails.options;
    }

    const progress = ((currentQ + 1) / questions.length) * 100;
    const isAnswered = answers[currentQ] !== undefined;
    const isLast = currentQ === questions.length - 1;

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.quizHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.quizHeaderTitle} numberOfLines={1}>{selectedQuiz.module}</Text>
              <Text style={styles.quizHeaderSubtitle}>Q {currentQ + 1} of {questions.length}</Text>
            </View>
            <View style={styles.timerBox}>
              <Text style={[styles.timerText, {color: timeLeft <= 60 ? '#ef4444' : timeLeft <= 300 ? '#f59e0b' : '#22c55e'}]}>
                ⏱️ {formatTime(timeLeft)}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
          </View>

          <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.questionText}>{qDetails.text}</Text>
            
            {options.map((opt, i) => {
              const selected = answers[currentQ] === i;
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.optionBtn, selected && styles.optionBtnSelected]}
                  onPress={() => selectAnswer(currentQ, i, opt)}
                >
                  <View style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                    <Text style={[styles.optionLetterText, selected && styles.optionLetterTextSelected]}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          
          <View style={styles.footerNav}>
            <TouchableOpacity 
              style={[styles.navBtn, currentQ === 0 && {opacity: 0.5}]} 
              disabled={currentQ === 0} 
              onPress={() => setCurrentQ(c => c - 1)}
            >
              <Text style={styles.navBtnText}>← Prev</Text>
            </TouchableOpacity>
            
            {isLast ? (
              <TouchableOpacity 
                style={[styles.navBtnPrimary, !isAnswered && {opacity: 0.5}]} 
                disabled={!isAnswered || loading} 
                onPress={handleSubmit}
              >
                <Text style={styles.navBtnPrimaryText}>{loading ? 'Submitting...' : 'Submit ✓'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.navBtnPrimary, !isAnswered && {opacity: 0.5}]} 
                disabled={!isAnswered} 
                onPress={() => setCurrentQ(c => c + 1)}
              >
                <Text style={styles.navBtnPrimaryText}>Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && resultData) {
    const passed = resultData.passed;
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{fontSize: 60, marginBottom: 20}}>{passed ? '🎉' : '😔'}</Text>
          <Text style={[styles.resultTitle, {color: passed ? '#22c55e' : '#ef4444'}]}>
            {passed ? 'Well Done! You Passed!' : 'Keep Trying!'}
          </Text>
          
          <BlurView intensity={30} tint="dark" style={styles.resultCard}>
            <Text style={[styles.resultScore, {color: passed ? '#22c55e' : '#ef4444'}]}>{Math.round(resultData.percentage)}%</Text>
            <View style={[styles.badge, {backgroundColor: passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}]}>
              <Text style={[styles.badgeText, {color: passed ? '#22c55e' : '#ef4444'}]}>{passed ? '✓ PASSED' : '✗ FAILED'}</Text>
            </View>
          </BlurView>
          
          <View style={{width: '100%', gap: 12}}>
            {!passed && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleStart(selectedQuiz)}>
                <Text style={styles.primaryButtonText}>Retry Assessment</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setPhase('list')}>
              <Text style={styles.secondaryButtonText}>Back to Assessments</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerDesc: { fontSize: 14, color: '#94a3b8' },
  scrollContent: { padding: 20 },
  
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyDesc: { color: '#94a3b8', textAlign: 'center' },
  
  quizCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 16 },
  quizCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  quizTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },
  quizMetaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  quizMetaText: { color: '#94a3b8', fontSize: 13 },
  startBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: 'bold' },

  // Quiz Header
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'rgba(15,23,42,0.8)' },
  quizHeaderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  quizHeaderSubtitle: { color: '#94a3b8', fontSize: 13 },
  timerBox: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  timerText: { fontWeight: 'bold', fontSize: 16 },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6' },

  // Questions
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 24, lineHeight: 28 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 12 },
  optionBtnSelected: { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: '#3b82f6' },
  optionLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionLetterSelected: { backgroundColor: '#3b82f6' },
  optionLetterText: { color: '#94a3b8', fontWeight: 'bold' },
  optionLetterTextSelected: { color: '#fff' },
  optionText: { color: '#fff', fontSize: 15, flex: 1 },
  optionTextSelected: { color: '#3b82f6', fontWeight: 'bold' },

  // Footer
  footerNav: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  navBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  navBtnText: { color: '#94a3b8', fontWeight: 'bold' },
  navBtnPrimary: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  navBtnPrimaryText: { color: '#fff', fontWeight: 'bold' },

  // Result
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  resultCard: { padding: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', marginBottom: 32, width: '100%' },
  resultScore: { fontSize: 64, fontWeight: '900', marginBottom: 12 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontWeight: 'bold' },
  primaryButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
