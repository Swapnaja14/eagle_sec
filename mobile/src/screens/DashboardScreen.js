import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PlayCircle, CheckCircle2, AlertCircle, Award, BookOpen, Clock, Calendar } from 'lucide-react-native';
import { dashboardAPI } from '../services/api';

const { width } = Dimensions.get('window');

// Fallback Mock Data
const FALLBACK_TRAINING = [
  { id: 1, module: 'PSARA Foundation Course', date: '2026-03-20', score: 88, status: 'passed', certificateReady: true },
  { id: 2, module: 'Fire Safety & Evacuation', date: '2026-02-14', score: 92, status: 'passed', certificateReady: true },
  { id: 3, module: 'Emergency Response Protocol', date: '2026-01-30', score: 74, status: 'passed', certificateReady: false },
  { id: 4, module: 'Access Control Procedures', date: '2026-04-10', score: null, status: 'in-progress', certificateReady: false },
];

const FALLBACK_SESSIONS = [
  { id: 1, module: 'First Aid & CPR Certification', date: '2026-04-18 at 10:00 AM', type: 'classroom', venue: 'Mumbai HQ - Hall 2' },
  { id: 2, "module": "CCTV Operations Mastery", "date": "2026-04-22 at 2:00 PM", "type": "virtual", "venue": "Zoom Link (sent via email)" },
];

const FALLBACK_ASSESSMENTS = [
  { id: 1, module: 'Access Control Procedures', deadline: '2026-04-20', questions: 20, timeLimit: 30, attempted: false },
  { id: 2, module: 'Customer Service Excellence', deadline: '2026-04-25', questions: 15, timeLimit: 20, attempted: false },
];

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getTraineeOverview();
      setData(response.data);
    } catch (e) {
      console.log('Failed to fetch from backend, using fallback data', e);
      setData({
        my_training: FALLBACK_TRAINING,
        upcoming_sessions: FALLBACK_SESSIONS,
        pending_assessments: FALLBACK_ASSESSMENTS
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
        <ActivityIndicator size="large" color="#3b82f6" style={{flex: 1}} />
      </View>
    );
  }

  const passed = data.my_training.filter(t => t.status === 'passed').length;
  const total = data.my_training.length;
  const avgScore = Math.round(data.my_training.filter(t => t.score).reduce((s, t) => s + t.score, 0) / Math.max(data.my_training.filter(t => t.score).length, 1));
  const certs = data.my_training.filter(t => t.certificateReady).length;
  const daysLeft = 22; // Mock days left

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.hero}>
            <Text style={styles.heroSubtitle}>🏠 My Learning Portal</Text>
            <Text style={styles.heroTitle}>Good morning, Alex! 👋</Text>
            <Text style={styles.heroDesc}>
              You have <Text style={{color: '#f59e0b', fontWeight: 'bold'}}>{data.pending_assessments.length} pending assessments</Text> and <Text style={{color: '#3b82f6', fontWeight: 'bold'}}>{data.upcoming_sessions.length} upcoming sessions</Text>.
            </Text>
          </View>

          {daysLeft <= 30 && (
            <BlurView intensity={20} tint="dark" style={styles.alertCard}>
              <AlertCircle color="#f59e0b" size={24} style={{marginRight: 12}} />
              <View style={{flex: 1}}>
                <Text style={styles.alertTitle}>PSARA Certification Expiring Soon!</Text>
                <Text style={styles.alertDesc}>Your certificate expires in {daysLeft} days. Contact admin for renewal.</Text>
              </View>
            </BlurView>
          )}

          {/* KPIs grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <BookOpen color="#22c55e" size={20} />
              </View>
              <Text style={[styles.kpiValue, { color: '#22c55e' }]}>{passed}/{total}</Text>
              <Text style={styles.kpiLabel}>Modules Completed</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Award color="#3b82f6" size={20} />
              </View>
              <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>{avgScore}%</Text>
              <Text style={styles.kpiLabel}>Avg Score</Text>
            </View>
          </View>

          {/* Pending Assessments */}
          <Text style={styles.sectionTitle}>📝 Pending Assessments</Text>
          {data.pending_assessments.length === 0 ? (
            <Text style={styles.emptyText}>No pending assessments. 🎉</Text>
          ) : data.pending_assessments.map(a => (
            <BlurView intensity={30} tint="dark" style={styles.assessmentCard} key={a.id}>
              <View style={styles.assessmentHeader}>
                <Text style={styles.assessmentTitle}>{a.module}</Text>
                <View style={styles.badgeDanger}><Text style={styles.badgeDangerText}>Due {a.deadline}</Text></View>
              </View>
              <Text style={styles.assessmentMeta}>{a.questions} questions • {a.timeLimit} min time limit</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('TakeAssessment')}>
                <Text style={styles.primaryButtonText}>Start Assessment →</Text>
              </TouchableOpacity>
            </BlurView>
          ))}

          {/* Upcoming Sessions */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📅 Upcoming Sessions</Text>
          {data.upcoming_sessions.map(s => (
            <BlurView intensity={30} tint="dark" style={styles.sessionCard} key={s.id}>
              <View style={[styles.sessionIconBox, { backgroundColor: s.type === 'virtual' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)' }]}>
                {s.type === 'virtual' ? <Clock color="#a855f7" size={20} /> : <Calendar color="#3b82f6" size={20} />}
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.sessionTitle}>{s.module}</Text>
                <Text style={styles.sessionMeta}>📅 {s.date}</Text>
                <Text style={styles.sessionMeta}>📍 {s.venue}</Text>
              </View>
            </BlurView>
          ))}

          {/* My Recent Training */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>My Recent Training</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyTrainingHistory')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {data.my_training.map(t => (
              <TouchableOpacity 
                key={t.id} 
                onPress={() => navigation.navigate('CourseDetail', { courseId: t.course_id || t.id })}
              >
                <BlurView intensity={30} tint="dark" style={styles.courseCard}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{t.module}</Text>
                  <Text style={styles.courseMeta}>{t.date}</Text>
                  <View style={styles.courseScoreRow}>
                    {t.score !== null ? (
                      <Text style={[styles.courseScore, { color: t.score >= 80 ? '#22c55e' : t.score >= 60 ? '#f59e0b' : '#ef4444' }]}>{t.score}%</Text>
                    ) : <Text style={styles.courseInProgress}>In Progress</Text>}
                    <View style={[styles.statusBadge, t.status === 'passed' ? styles.statusActive : t.status === 'in-progress' ? styles.statusDraft : styles.statusRetired]}>
                      <Text style={styles.statusBadgeText}>{t.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  hero: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
  },
  heroSubtitle: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  heroDesc: { color: '#cbd5e1', fontSize: 15, lineHeight: 22 },

  alertCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    backgroundColor: 'rgba(245,158,11,0.1)',
    marginBottom: 24,
    alignItems: 'center',
  },
  alertTitle: { color: '#f59e0b', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  alertDesc: { color: '#cbd5e1', fontSize: 13 },

  kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  kpiCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  kpiIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  kpiValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  viewAllText: { color: '#3b82f6', fontWeight: '600' },
  emptyText: { color: '#94a3b8', textAlign: 'center', padding: 20 },

  assessmentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.05)',
    marginBottom: 12,
  },
  assessmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  assessmentTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', flex: 1, marginRight: 10 },
  badgeDanger: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeDangerText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  assessmentMeta: { color: '#94a3b8', fontSize: 13, marginBottom: 16 },

  primaryButton: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  sessionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 12,
    alignItems: 'center',
  },
  sessionIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  sessionMeta: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },

  horizontalScroll: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 32 },
  courseCard: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 16,
  },
  courseTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 6, height: 40 },
  courseMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  courseScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseScore: { fontSize: 18, fontWeight: '900' },
  courseInProgress: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#ffffff' },
  statusActive: { backgroundColor: 'rgba(34,197,94,0.3)' },
  statusDraft: { backgroundColor: 'rgba(59,130,246,0.3)' },
  statusRetired: { backgroundColor: 'rgba(100,116,139,0.3)' },
});
