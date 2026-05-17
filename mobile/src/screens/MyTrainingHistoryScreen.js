import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Award, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { dashboardAPI } from '../services/api';

export default function MyTrainingHistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getTraineeOverview();
      setHistory(res.data.my_training || []);
    } catch (e) {
      console.log('Failed to fetch history', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'passed': return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle2, text: 'PASSED' };
      case 'failed': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle, text: 'FAILED' };
      default: return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: Clock, text: 'IN PROGRESS' };
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>My Training History</Text>
            <Text style={styles.headerDesc}>All your recent training activities</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 100}} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <BookOpen color="#64748b" size={48} style={{marginBottom: 16}} />
                <Text style={styles.emptyTitle}>No History Found</Text>
                <Text style={styles.emptyDesc}>You haven't participated in any training sessions yet.</Text>
              </View>
            ) : history.map(item => {
              const status = getStatusConfig(item.status);
              const StatusIcon = status.icon;
              return (
                <BlurView intensity={30} tint="dark" style={styles.card} key={item.id}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.moduleTitle} numberOfLines={2}>{item.module}</Text>
                    <View style={[styles.statusBadge, {backgroundColor: status.bg}]}>
                      <StatusIcon color={status.color} size={14} style={{marginRight: 4}} />
                      <Text style={[styles.statusText, {color: status.color}]}>{status.text}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <View>
                      <Text style={styles.metaLabel}>Date Completed</Text>
                      <Text style={styles.metaValue}>{item.date || '—'}</Text>
                    </View>
                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.metaLabel}>Score</Text>
                      <Text style={[styles.metaValue, {color: item.score !== null ? (item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444') : '#94a3b8', fontSize: 20, fontWeight: '900'}]}>
                        {item.score !== null ? `${item.score}%` : '—'}
                      </Text>
                    </View>
                  </View>
                  
                  {item.certificateReady && (
                    <TouchableOpacity style={styles.certBtn} onPress={() => navigation.navigate('MyCertificates')}>
                      <Award color="#3b82f6" size={18} style={{marginRight: 8}} />
                      <Text style={styles.certBtnText}>View Certificate</Text>
                    </TouchableOpacity>
                  )}
                </BlurView>
              )
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 10 },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerDesc: { fontSize: 14, color: '#94a3b8' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyDesc: { color: '#94a3b8', textAlign: 'center' },
  
  card: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  moduleTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  metaLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  metaValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  
  certBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingVertical: 12, borderRadius: 10 },
  certBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },
});
