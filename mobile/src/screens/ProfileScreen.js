import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Award, LogOut, FileText } from 'lucide-react-native';
import { dashboardAPI, authAPI } from '../services/api';

export default function ProfileScreen({ navigation, setIsLoggedIn }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const res = await dashboardAPI.getTraineeOverview();
      setUserData(res.data.user);
    } catch (e) {
      console.log('Failed to fetch profile', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const doLogout = async () => {
    await authAPI.logout();
    if (setIsLoggedIn) setIsLoggedIn(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
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

  const displayName = userData
    ? (`${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username)
    : '—';
  
  const roleLine = userData
    ? `${userData.role?.toUpperCase() || 'USER'}${userData.department ? ' • ' + userData.department : ''}${userData.username ? ' • ' + userData.username : ''}`
    : 'Loading…';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor="#3b82f6" />}
          >
            
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <User color="#fff" size={40} />
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.role}>{roleLine}</Text>
              {userData?.email ? <Text style={[styles.role, { marginTop: 4 }]}>{userData.email}</Text> : null}
            </View>

            <BlurView intensity={30} tint="dark" style={styles.psaraCard}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                <Shield color="#22c55e" size={24} style={{marginRight: 10}} />
                <Text style={styles.psaraTitle}>Compliance Status</Text>
              </View>
              <Text style={styles.psaraText}>All required compliance training is up to date.</Text>
              <TouchableOpacity style={styles.renewBtn}>
                <Text style={styles.renewText}>View Policies</Text>
              </TouchableOpacity>
            </BlurView>

            <Text style={styles.sectionTitle}>My Records</Text>
            
            <TouchableOpacity onPress={() => navigation.navigate('MyCertificates')}>
              <BlurView intensity={30} tint="dark" style={styles.actionCard}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(245,158,11,0.1)'}]}>
                  <Award color="#f59e0b" size={24} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>My Certificates</Text>
                  <Text style={styles.cardDesc}>View and download your earned certificates</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('MyTrainingHistory')}>
              <BlurView intensity={30} tint="dark" style={styles.actionCard}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(59,130,246,0.1)'}]}>
                  <FileText color="#3b82f6" size={24} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.cardTitle}>Training History</Text>
                  <Text style={styles.cardDesc}>Review your past training sessions</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut color="#ef4444" size={20} style={{marginRight: 8}} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

          </ScrollView>
        )}
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
  role: { fontSize: 15, color: '#94a3b8', marginTop: 2 },

  psaraCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.05)', marginBottom: 32 },
  psaraTitle: { fontSize: 18, fontWeight: 'bold', color: '#22c55e' },
  psaraText: { color: '#cbd5e1', fontSize: 15, marginBottom: 16 },
  renewBtn: { backgroundColor: '#22c55e', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  renewText: { color: '#fff', fontWeight: 'bold' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardDesc: { color: '#94a3b8', fontSize: 13 },
  arrow: { color: '#94a3b8', fontSize: 20, fontWeight: 'bold' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 40, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 }
});
