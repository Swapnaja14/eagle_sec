import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  User,
  Award,
  LogOut,
  Mail,
  Briefcase,
  Download,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react-native';

import { authAPI, certificatesAPI } from '../services/api';

import {
  colors,
  spacing,
  radius,
  typography,
  shared,
  shadows,
} from '../theme';

export default function ProfileScreen({
  navigation,
  setIsLoggedIn,
}) {
  const [me, setMe] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);

      const meRes = await authAPI.me();

      setMe(meRes.data);

      const c = await certificatesAPI
        .forEmployee(meRes.data.id)
        .catch(() => ({ data: [] }));

      const list = c.data?.results || c.data || [];

      setCerts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('Profile load failed', e?.message);
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

    if (setIsLoggedIn) {
      setIsLoggedIn(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm('Are you sure you want to sign out?')
      ) {
        doLogout();
      }

      return;
    }

    Alert.alert('Log Out', 'Are you sure?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          shared.screen,
          {
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  const name = me
    ? `${me.first_name || ''} ${me.last_name || ''}`.trim() ||
      me.username
    : '—';

  const role = me?.role?.toUpperCase() || 'USER';

  return (
    <SafeAreaView
      style={shared.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            tintColor={colors.text}
          />
        }
      >
        {/* Header */}
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

          {me?.email ? (
            <Text style={styles.emailText}>{me.email}</Text>
          ) : null}
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          {me?.email ? (
            <InfoRow
              icon={Mail}
              label="Email"
              value={me.email}
            />
          ) : null}

          {me?.department ? (
            <InfoRow
              icon={Briefcase}
              label="Department"
              value={me.department}
            />
          ) : null}

          {me?.username ? (
            <InfoRow
              icon={User}
              label="Username"
              value={me.username}
            />
          ) : null}
        </View>

        {/* Compliance Card */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <Shield size={22} color="#15803D" />
            <Text style={styles.complianceTitle}>
              Compliance Status
            </Text>
          </View>

          <Text style={styles.complianceText}>
            All required compliance training is up to date.
          </Text>

          <TouchableOpacity style={styles.policyBtn}>
            <Text style={styles.policyBtnText}>
              View Policies
            </Text>
          </TouchableOpacity>
        </View>

        {/* Records */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>My Records</Text>
        </View>

        <View style={styles.recordsContainer}>
          <TouchableOpacity
            style={styles.recordCard}
            onPress={() =>
              navigation.navigate('MyCertificates')
            }
          >
            <View
              style={[
                styles.recordIcon,
                { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Award size={22} color="#D97706" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>
                My Certificates
              </Text>

              <Text style={styles.recordSub}>
                View and download certificates
              </Text>
            </View>

            <ChevronRight
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recordCard}
            onPress={() =>
              navigation.navigate('MyTrainingHistory')
            }
          >
            <View
              style={[
                styles.recordIcon,
                { backgroundColor: '#DBEAFE' },
              ]}
            >
              <FileText size={22} color="#2563EB" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>
                Training History
              </Text>

              <Text style={styles.recordSub}>
                Review your completed training
              </Text>
            </View>

            <ChevronRight
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Certificates */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>
            Recent Certificates
          </Text>

          <Text style={shared.sectionLink}>
            {certs.length} earned
          </Text>
        </View>

        <View style={styles.certsContainer}>
          {certs.length === 0 ? (
            <View style={styles.empty}>
              <Award
                size={36}
                color={colors.textMuted}
              />

              <Text
                style={[
                  typography.bodyMuted,
                  {
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  },
                ]}
              >
                No certificates yet.
                {'\n'}
                Pass an assessment to earn one.
              </Text>
            </View>
          ) : (
            certs.map((c) => (
              <View key={c.id} style={styles.cert}>
                <View style={styles.certIcon}>
                  <Award
                    size={20}
                    color={colors.text}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.certTitle}
                    numberOfLines={1}
                  >
                    {c.course_title ||
                      `Course #${c.course}`}
                  </Text>

                  <Text style={styles.certSub}>
                    Issued{' '}
                    {c.issued_at
                      ? new Date(
                          c.issued_at
                        ).toLocaleDateString()
                      : '—'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dlBtn}
                  onPress={() =>
                    c.download_url &&
                    Linking.openURL(c.download_url)
                  }
                >
                  <Download
                    size={16}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Logout */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>
            Settings
          </Text>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.logoutIcon,
                { backgroundColor: '#FEE2E2' },
              ]}
            >
              <LogOut
                size={18}
                color={colors.danger}
              />
            </View>

            <Text style={styles.logoutText}>
              Log Out
            </Text>

            <ChevronRight
              size={16}
              color={colors.textMuted}
            />
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
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={1}
        >
          {value}
        </Text>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    ...typography.h1,
    fontSize: 22,
    marginTop: spacing.md,
  },

  rolePill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },

  emailText: {
    marginTop: spacing.sm,
    color: '#3a3a3a',
    fontSize: 13,
  },

  infoContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -20,
    gap: spacing.md,
  },

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  complianceCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  complianceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },

  complianceText: {
    color: '#166534',
    fontSize: 14,
    marginBottom: spacing.md,
  },

  policyBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
  },

  policyBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  recordsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },

  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  recordTitle: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },

  recordSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  certsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  certTitle: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 14,
  },

  certSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  dlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.pill,
  },

  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  logoutText: {
    flex: 1,
    fontWeight: '700',
    color: colors.danger,
    fontSize: 14,
  },
});