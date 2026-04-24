import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'lucide-react-native';
import { coursesAPI, baseURL } from '../services/api';

export default function CatalogScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const mapCourse = (course) => ({
    id: course.id,
    title: course.display_name || 'Untitled Course',
    duration: course.lesson_count ? `${course.lesson_count} lessons` : 'Self-paced',
    category: course.category || 'General',
    progress: course.progress?.percent ?? 0,
    recommendation: course.recommendation?.message || 'Keep progressing with your training plan.',
    certificateUrl: course.certificate_url || null,
  });

  const loadCourses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      const response = await coursesAPI.getAllocatedForTrainee();
      const allocatedCourses = response.data?.results || [];
      setCourses(allocatedCourses.map(mapCourse));
    } catch (e) {
      setError('Unable to fetch courses right now.');
      setCourses([]);
      console.log('Failed to fetch trainee courses', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    const intervalId = setInterval(() => loadCourses(true), 30000);
    return () => clearInterval(intervalId);
  }, [loadCourses]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Catalog</Text>
          <Text style={styles.headerDesc}>Explore and enroll in new training modules</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCourses(true)} tintColor="#3b82f6" />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
          ) : null}

          {!loading && error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {!loading && !error && courses.length === 0 ? (
            <Text style={styles.emptyText}>No allocated courses available yet.</Text>
          ) : null}

          {courses.map(course => (
            <BlurView intensity={30} tint="dark" style={styles.card} key={course.id}>
              <View style={styles.iconBox}>
                <BookOpen color="#3b82f6" size={24} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>⏱️ {course.duration}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{course.category}</Text>
                  </View>
                </View>
                <Text style={styles.progressText}>Progress: {course.progress}%</Text>
                <Text style={styles.recommendationText}>{course.recommendation}</Text>
                
                {course.certificateUrl ? (
                  <TouchableOpacity 
                    style={[styles.enrollBtn, { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', marginBottom: 8 }]} 
                    onPress={() => Linking.openURL(`${baseURL.replace('/api', '')}/api${course.certificateUrl}`)}
                  >
                    <Text style={[styles.enrollText, { color: '#10b981' }]}>View Certificate</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity 
                  style={styles.enrollBtn} 
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
                >
                  <Text style={styles.enrollText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  header: { padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerDesc: { fontSize: 15, color: '#94a3b8' },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  loader: { marginTop: 24 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 20 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 20 },
  
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 16,
  },
  iconBox: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  cardContent: { flex: 1 },
  courseTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaText: { fontSize: 13, color: '#94a3b8', marginRight: 12 },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  progressText: { fontSize: 12, color: '#60a5fa', marginBottom: 4 },
  recommendationText: { fontSize: 12, color: '#cbd5e1', marginBottom: 10 },
  
  enrollBtn: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  enrollText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 }
});
