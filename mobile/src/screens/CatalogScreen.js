import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'lucide-react-native';
import { coursesAPI } from '../services/api';

export default function CatalogScreen() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await coursesAPI.list();
      setCourses(res.data);
    } catch (e) {
      console.log('Failed to fetch courses', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Catalog</Text>
          <Text style={styles.headerDesc}>Explore and enroll in new training modules</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 100}} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {courses.length === 0 ? (
              <View style={styles.emptyState}>
                <BookOpen color="#64748b" size={48} style={{marginBottom: 16}} />
                <Text style={styles.emptyTitle}>No Courses Available</Text>
                <Text style={styles.emptyDesc}>Check back later for new training modules.</Text>
              </View>
            ) : courses.map(course => (
              <BlurView intensity={30} tint="dark" style={styles.card} key={course.id}>
                <View style={styles.iconBox}>
                  <BookOpen color="#3b82f6" size={24} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.courseTitle}>{course.display_name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Status: {course.status}</Text>
                    {course.skills_taxonomy !== 'none' && (
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{course.skills_taxonomy}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.enrollBtn}>
                    <Text style={styles.enrollText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ))}
          </ScrollView>
        )}
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
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyDesc: { color: '#94a3b8', textAlign: 'center' },
  
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
  metaText: { fontSize: 13, color: '#94a3b8', marginRight: 12, textTransform: 'capitalize' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  
  enrollBtn: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  enrollText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 }
});
