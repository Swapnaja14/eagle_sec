import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen } from 'lucide-react-native';

const AVAILABLE_COURSES = [
  { id: 1, title: 'PSARA Foundation Course', duration: '4h 30m', category: 'Compliance' },
  { id: 2, title: 'Fire Safety & Evacuation', duration: '2h 15m', category: 'Safety' },
  { id: 3, title: 'Emergency Response Protocol', duration: '3h 0m', category: 'Safety' },
  { id: 4, title: 'Access Control Procedures', duration: '1h 45m', category: 'Security' },
];

export default function CatalogScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Catalog</Text>
          <Text style={styles.headerDesc}>Explore and enroll in new training modules</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {AVAILABLE_COURSES.map(course => (
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
                <TouchableOpacity style={styles.enrollBtn}>
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
  
  enrollBtn: { backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  enrollText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 }
});
