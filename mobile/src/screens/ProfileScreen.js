import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Shield, Award, LogOut } from 'lucide-react-native';

const CERTIFICATES = [
  { id: 1, title: 'PSARA Foundation Course', date: 'March 2026' },
  { id: 2, title: 'Fire Safety & Evacuation', date: 'February 2026' },
];

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User color="#fff" size={40} />
            </View>
            <Text style={styles.name}>Alex Trainee</Text>
            <Text style={styles.role}>Security Officer • ID: EMP-001</Text>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.psaraCard}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
              <Shield color="#22c55e" size={24} style={{marginRight: 10}} />
              <Text style={styles.psaraTitle}>PSARA Status: Active</Text>
            </View>
            <Text style={styles.psaraText}>Expires in: 22 Days (May 10, 2026)</Text>
            <TouchableOpacity style={styles.renewBtn}>
              <Text style={styles.renewText}>Request Renewal</Text>
            </TouchableOpacity>
          </BlurView>

          <Text style={styles.sectionTitle}>My Certificates</Text>
          {CERTIFICATES.map(cert => (
            <BlurView intensity={30} tint="dark" style={styles.certCard} key={cert.id}>
              <Award color="#f59e0b" size={24} style={{marginRight: 16}} />
              <View style={{flex: 1}}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certDate}>Issued: {cert.date}</Text>
              </View>
              <TouchableOpacity>
                <Text style={{color: '#3b82f6', fontWeight: 'bold'}}>Download</Text>
              </TouchableOpacity>
            </BlurView>
          ))}

          <TouchableOpacity style={styles.logoutBtn}>
            <LogOut color="#ef4444" size={20} style={{marginRight: 8}} />
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
