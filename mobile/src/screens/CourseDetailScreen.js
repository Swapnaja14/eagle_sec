
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, CheckCircle, Clock, Shield, ArrowLeft } from 'lucide-react-native';
import { coursesAPI } from '../services/api';

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourseDetail = async () => {
      try {
        const response = await coursesAPI.get(courseId);
        setCourse(response.data);
      } catch (error) {
        console.error('Failed to load course details', error);
        Alert.alert('Error', 'Unable to load course details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadCourseDetail();
  }, [courseId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!course) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentCard}>
            <Text style={styles.title}>{course.display_name}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock color="#94a3b8" size={16} />
                <Text style={styles.metaText}>Self-paced</Text>
              </View>
              <View style={styles.metaItem}>
                <Shield color="#94a3b8" size={16} />
                <Text style={styles.metaText}>{course.compliance_taxonomy}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{course.description || 'No description available.'}</Text>

            <Text style={styles.sectionTitle}>Curriculum</Text>
            {course.lessons && course.lessons.length > 0 ? (
              course.lessons.map((lesson, index) => (
                <View key={lesson.id || index} style={styles.lessonItem}>
                  <View style={styles.lessonOrder}>
                    <Text style={styles.lessonOrderText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  {lesson.is_completed && <CheckCircle color="#10b981" size={18} />}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No lessons available for this course.</Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={() => Alert.alert("Coming Soon", "Course player will be integrated soon.")}>
            <Text style={styles.startBtnText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: { padding: 5, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  contentCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  metaRow: { flexDirection: 'row', marginBottom: 25 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  metaText: { color: '#94a3b8', fontSize: 14, marginLeft: 6 },
  sectionTitle: { color: '#3b82f6', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  description: { color: '#cbd5e1', fontSize: 16, lineHeight: 22, marginBottom: 25 },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  lessonOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonOrderText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  lessonTitle: { color: '#f1f5f9', fontSize: 16, flex: 1 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic' },
  footer: { padding: 20, backgroundColor: '#1e293b' },
  startBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
