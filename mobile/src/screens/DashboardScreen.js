import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GraduationCap, BookOpen, Award, Calendar, Bell, ChevronRight, TrendingUp, CheckCircle2,
} from 'lucide-react-native';
import { dashboardAPI, authAPI, certificatesAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function DashboardScreen({ navigation }) {
  const [me, setMe] = useState(null);
  const [overview, setOverview] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);

      const meRes = await authAPI.me().catch(() => null);
      const ov = await dashboardAPI.getTraineeOverview().catch(() => ({ data: null }));

      if (meRes) {
        setMe(meRes.data);
        const c = await certificatesAPI.forEmployee(meRes.data.id).catch(() => ({ data: [] }));
        const list = c.data?.results || c.data || [];
        setCerts(Array.isArray(list) ? list : []);
      }
      setOverview(ov.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  const myTraining = overview?.my_training || [];
  const completed = myTraining.filter((t) => t.status === 'passed' || t.status === 'completed').length;
  const inProgress = myTraining.filter((t) => t.status !== 'passed' && t.status !== 'completed').length;
  const greetName = me?.first_name || me?.username || 'there';

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.text} />}
      >
        {/* Yellow header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greet}>Welcome back,</Text>
              <Text style={styles.name}>{greetName} 👋</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.stats}>
          <StatCard icon={BookOpen} value={myTraining.length} label="Enrolled" />
          <StatCard icon={CheckCircle2} value={completed} label="Completed" />
          <StatCard icon={Award} value={certs.length} label="Certificates" />
        </View>

        {/* Quick actions */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <ActionRow
            icon={GraduationCap}
            title="Browse Courses"
            sub="Explore all available training modules"
            onPress={() => navigation.navigate('Catalog')}
          />
          <ActionRow
            icon={Calendar}
            title="Upcoming Sessions"
            sub="See scheduled training and webinars"
            onPress={() => navigation.navigate('Calendar')}
          />
          <ActionRow
            icon={Award}
            title="My Certificates"
            sub={certs.length ? `${certs.length} earned` : 'No certificates yet'}
            onPress={() => navigation.navigate('Profile')}
          />
        </View>

        {/* My Training */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>My Training</Text>
          <Text style={shared.sectionLink}>{myTraining.length} items</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {myTraining.length === 0 ? (
            <View style={styles.empty}>
              <Text style={typography.bodyMuted}>No training records yet.</Text>
              <Text style={[typography.small, { marginTop: 4 }]}>Browse courses to get started.</Text>
            </View>
          ) : (
            myTraining.map((t) => (
              <View key={t.id} style={styles.tCard}>
                <View style={styles.tIcon}>
                  <TrendingUp size={18} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tTitle} numberOfLines={1}>{t.module}</Text>
                  <Text style={styles.tSub}>
                    {t.date} • Score: {t.score ?? '—'}{t.score != null ? '%' : ''}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        t.status === 'passed' || t.status === 'completed'
                          ? '#DCFCE7'
                          : t.status === 'failed'
                          ? '#FEE2E2'
                          : colors.cardSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          t.status === 'passed' || t.status === 'completed'
                            ? '#15803D'
                            : t.status === 'failed'
                            ? '#B91C1C'
                            : colors.text,
                      },
                    ]}
                  >
                    {t.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Icon size={18} color={colors.text} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon: Icon, title, sub, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.action}>
      <View style={styles.actionIcon}>
        <Icon size={20} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{sub}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greet: { fontSize: 14, color: '#3a3a3a' },
  name: { ...typography.h1, fontSize: 26, marginTop: 2 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.pill,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -28,
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { ...typography.h2, fontSize: 20 },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },
  actionIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  actionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.pill,
  },
  tCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },
  tIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  tTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  tSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
