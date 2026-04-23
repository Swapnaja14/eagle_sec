import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Award, LogOut } from 'lucide-react-native';
import { authAPI, certificatesAPI } from '../services/api';

export default function ProfileScreen({ navigation, setIsLoggedIn }) {
  const [me, setMe] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const { data: user } = await authAPI.me();
      setMe(user);
      try {
        const { data: certs } = await certificatesAPI.forEmployee(user.id);
        const list = Array.isArray(certs) ? certs : (certs?.results || []);
        setCertificates(list);
      } catch {
        setCertificates([]);
      }
    } catch (e) {
      console.log('Failed to load profile', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doLogout = async () => {
    await authAPI.logout();
    // App.js conditional rendering shows Login automatically when flag flips.
    if (setIsLoggedIn) setIsLoggedIn(false);
  };

  const handleLogout = () => {
    // Alert.alert on React Native Web does NOT invoke button callbacks,
    // so on web we use window.confirm instead.
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doLogout();
      }
      return;
    }
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  const displayName = me
    ? (`${me.first_name || ''} ${me.last_name || ''}`.trim() || me.username)
    : '—';
  const roleLine = me
    ? `${me.role?.toUpperCase() || 'USER'}${me.department ? ' • ' + me.department : ''}${me.username ? ' • ' + me.username : ''}`
    : 'Loading…';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#3b82f6" />}
        >

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User color="#fff" size={40} />
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>{roleLine}</Text>
            {me?.email ? <Text style={[styles.role, { marginTop: 4 }]}>{me.email}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>My Certificates</Text>
          {certificates.length === 0 ? (
            <Text style={{ color: '#94a3b8', marginBottom: 20 }}>
              No certificates issued yet. Pass a course assessment to earn one.
            </Text>
          ) : (
            certificates.map(cert => (
              <BlurView intensity={30} tint="dark" style={styles.certCard} key={cert.id}>
                <Award color="#f59e0b" size={24} style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle}>{cert.course_title || `Course #${cert.course}`}</Text>
                  <Text style={styles.certDate}>
                    Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    const { Linking } = await import('react-native');
                    if (cert.download_url) Linking.openURL(cert.download_url);
                  }}
                >
                  <Text style={{ color: '#3b82f6', fontWeight: 'bold' }}>Download</Text>
                </TouchableOpacity>
              </BlurView>
            ))
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#ef4444" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  profileHeader: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(59,130,246,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#3b82f6' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  role: { fontSize: 15, color: '#94a3b8' },

  psaraCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.05)', marginBottom: 32 },
  psaraTitle: { fontSize: 18, fontWeight: 'bold', color: '#22c55e' },
  psaraText: { color: '#cbd5e1', fontSize: 15, marginBottom: 16 },
  renewBtn: { backgroundColor: '#22c55e', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  renewText: { color: '#fff', fontWeight: 'bold' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  certCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 12 },
  certTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  certDate: { color: '#94a3b8', fontSize: 13 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 40, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
