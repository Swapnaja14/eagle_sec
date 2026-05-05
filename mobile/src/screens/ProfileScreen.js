import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Award, LogOut, Mail, Briefcase, Download, Settings, ChevronRight,
} from 'lucide-react-native';
import { authAPI, certificatesAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function ProfileScreen({ setIsLoggedIn }) {
  const [me, setMe] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const meRes = await authAPI.me();
      setMe(meRes.data);
      const c = await certificatesAPI.forEmployee(meRes.data.id).catch(() => ({ data: [] }));
      const list = c.data?.results || c.data || [];
      setCerts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('Profile load failed', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doLogout = async () => {
    await authAPI.logout();
    if (setIsLoggedIn) setIsLoggedIn(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Sign out?')) doLogout();
      return;
    }
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: doLogout },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  const name = me ? `${me.first_name || ''} ${me.last_name || ''}`.trim() || me.username : '—';
  const role = me?.role?.toUpperCase() || 'USER';

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.text} />}
      >
        {/* Yellow header with avatar */}
        <View style={styles.header}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatar}>
              <User size={36} color={colors.text} />
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        {/* Info cards */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: -20, gap: spacing.md }}>
          {me?.email ? (
            <InfoRow icon={Mail} label="Email" value={me.email} />
          ) : null}
          {me?.department ? (
            <InfoRow icon={Briefcase} label="Department" value={me.department} />
          ) : null}
          {me?.username ? (
            <InfoRow icon={User} label="Username" value={me.username} />
          ) : null}
        </View>

        {/* Certificates */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>My Certificates</Text>
          <Text style={shared.sectionLink}>{certs.length} earned</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {certs.length === 0 ? (
            <View style={styles.empty}>
              <Award size={36} color={colors.textMuted} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center' }]}>
                No certificates yet.{'\n'}Pass an assessment to earn one.
              </Text>
            </View>
          ) : (
            certs.map((c) => (
              <View key={c.id} style={styles.cert}>
                <View style={styles.certIcon}>
                  <Award size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certTitle} numberOfLines={1}>
                    {c.course_title || `Course #${c.course}`}
                  </Text>
                  <Text style={styles.certSub}>
                    Issued {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dlBtn}
                  onPress={() => c.download_url && Linking.openURL(c.download_url)}
                >
                  <Download size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Settings */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>Settings</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
              <LogOut size={18} color={colors.danger} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.danger }]}>Log Out</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}>
        <Icon size={18} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    alignItems: 'center',
  },
  avatarOuter: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { ...typography.h1, fontSize: 22, marginTop: spacing.md },
  rolePill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 11, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },
  infoIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoLabel: { fontSize: 11, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.pill,
  },
  cert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },
  certIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  certTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  certSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dlBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.cardSoft,
  },
  rowTitle: { flex: 1, fontWeight: '700', color: colors.text, fontSize: 14 },
});
