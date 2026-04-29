import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, ArrowLeft, Download, Share2 } from 'lucide-react-native';
import { dashboardAPI } from '../services/api';

export default function MyCertificatesScreen({ navigation }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getTraineeOverview();
      const myTraining = res.data.my_training || [];
      const certs = myTraining.filter(t => t.certificateReady);
      setCertificates(certs);
    } catch (e) {
      console.log('Failed to fetch certificates', e);
    } finally {
      setLoading(false);
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
            <Text style={styles.headerTitle}>My Certificates</Text>
            <Text style={styles.headerDesc}>Certificates you've earned</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 100}} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {certificates.length === 0 ? (
              <View style={styles.emptyState}>
                <Award color="#64748b" size={48} style={{marginBottom: 16}} />
                <Text style={styles.emptyTitle}>No Certificates Yet</Text>
                <Text style={styles.emptyDesc}>Complete a training module and pass the assessment to earn your first certificate.</Text>
              </View>
            ) : certificates.map(cert => {
              const isExpanded = expanded === cert.id;
              return (
                <View key={cert.id} style={styles.cardWrapper}>
                  <TouchableOpacity onPress={() => setExpanded(isExpanded ? null : cert.id)}>
                    <BlurView intensity={30} tint="dark" style={[styles.card, isExpanded && styles.cardExpanded]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.iconBox}><Award color="#3b82f6" size={24} /></View>
                        <View style={{flex: 1}}>
                          <Text style={styles.certTitle} numberOfLines={1}>{cert.module}</Text>
                          <Text style={styles.certMeta}>Issued: {cert.date} • Score: <Text style={{color: '#22c55e', fontWeight: 'bold'}}>{cert.score}%</Text></Text>
                        </View>
                      </View>
                    </BlurView>
                  </TouchableOpacity>

                  {isExpanded && (
                    <BlurView intensity={20} tint="dark" style={styles.previewContainer}>
                      <View style={styles.certificatePreview}>
                        <View style={styles.cornerTL} /><View style={styles.cornerTR} />
                        <View style={styles.cornerBL} /><View style={styles.cornerBR} />
                        
                        <Award color="#3b82f6" size={40} style={{marginBottom: 12}} />
                        <Text style={styles.previewSubtitle}>CERTIFICATE OF COMPLETION</Text>
                        <Text style={styles.previewText}>This certifies that you have successfully completed</Text>
                        <Text style={styles.previewModuleTitle}>{cert.module}</Text>
                        <View style={styles.previewMetaRow}>
                          <View style={styles.previewMetaBox}>
                            <Text style={styles.previewMetaLabel}>Score</Text>
                            <Text style={styles.previewMetaValue}>{cert.score}%</Text>
                          </View>
                          <View style={styles.previewMetaBox}>
                            <Text style={styles.previewMetaLabel}>Date</Text>
                            <Text style={styles.previewMetaValue}>{cert.date}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn}>
                          <Download color="#fff" size={16} style={{marginRight: 8}} />
                          <Text style={styles.actionBtnText}>Download PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnSecondary}>
                          <Share2 color="#3b82f6" size={16} style={{marginRight: 8}} />
                          <Text style={styles.actionBtnTextSecondary}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </BlurView>
                  )}
                </View>
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
  
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyDesc: { color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  
  cardWrapper: { marginBottom: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)' },
  cardExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  certTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  certMeta: { fontSize: 13, color: '#94a3b8' },

  previewContainer: { padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderTopWidth: 0, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' },
  certificatePreview: { padding: 32, alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 2, borderColor: '#3b82f6', position: 'relative', marginBottom: 20 },
  cornerTL: { position: 'absolute', top: 8, left: 8, width: 30, height: 30, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(59,130,246,0.4)' },
  cornerTR: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderTopWidth: 2, borderRightWidth: 2, borderColor: 'rgba(59,130,246,0.4)' },
  cornerBL: { position: 'absolute', bottom: 8, left: 8, width: 30, height: 30, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(59,130,246,0.4)' },
  cornerBR: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(59,130,246,0.4)' },
  
  previewSubtitle: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  previewText: { color: '#94a3b8', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  previewModuleTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  previewMetaRow: { flexDirection: 'row', gap: 32 },
  previewMetaBox: { alignItems: 'center' },
  previewMetaLabel: { color: '#64748b', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  previewMetaValue: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 1, borderColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnTextSecondary: { color: '#3b82f6', fontWeight: 'bold', fontSize: 14 },
});
