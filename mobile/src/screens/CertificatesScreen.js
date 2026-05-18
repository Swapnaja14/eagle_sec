import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Award, Download, ExternalLink, Calendar, CheckCircle2,
} from 'lucide-react-native';
import { certificatesApi } from '../api/certificates.api';
import { authAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function CertificatesScreen({ navigation }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const loadCertificates = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      // Get current user ID
      let currentUserId = userId;
      if (!currentUserId) {
        const meRes = await authAPI.me().catch(() => null);
        if (meRes?.data?.id) {
          currentUserId = meRes.data.id;
          setUserId(currentUserId);
        }
      }

      if (!currentUserId) {
        throw new Error('Unable to get user information');
      }

      const data = await certificatesApi.getMyCertificates(currentUserId);
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[CertificatesScreen] Load error:', err);
      setError(err?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleDownloadCertificate = useCallback(async (certificate) => {
    if (!certificate?.id) {
      Alert.alert('Error', 'Certificate ID not available');
      return;
    }

    try {
      const downloadUrl = certificatesApi.getCertificateUrl(certificate.id);
      if (!downloadUrl) {
        Alert.alert('Error', 'Download URL not available');
        return;
      }

      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert('Error', 'Cannot open download URL');
      }
    } catch (err) {
      console.error('[CertificatesScreen] Download error:', err);
      Alert.alert('Error', 'Failed to download certificate');
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} size="large" />
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>Loading certificates...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Certificates</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadCertificates(true)} tintColor={colors.text} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadCertificates()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && certificates.length === 0 && (
          <View style={styles.empty}>
            <Award size={64} color={colors.textMuted} />
            <Text style={[typography.h2, { marginTop: spacing.lg }]}>No Certificates Yet</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
              Complete your assigned courses and pass assessments to earn certificates.
            </Text>
          </View>
        )}

        {certificates.map((cert, index) => (
          <View key={cert?.id || index} style={styles.certCard}>
            <View style={styles.certHeader}>
              <View style={styles.awardIcon}>
                <Award size={24} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certTitle} numberOfLines={2}>
                  {cert?.course?.display_name || 'Certificate of Completion'}
                </Text>
                <View style={styles.metaRow}>
                  <Calendar size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>Issued: {formatDate(cert?.issued_at)}</Text>
                </View>
              </View>
            </View>

            {cert?.employee && (
              <View style={styles.recipientRow}>
                <CheckCircle2 size={14} color="#15803D" />
                <Text style={styles.recipientText}>
                  Awarded to {cert.employee.first_name} {cert.employee.last_name}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownloadCertificate(cert)}
              >
                <Download size={16} color={colors.text} />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </TouchableOpacity>
              {cert?.download_url && (
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => {
                    Linking.openURL(cert.download_url).catch(() => {
                      Alert.alert('Error', 'Cannot open certificate');
                    });
                  }}
                >
                  <ExternalLink size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {certificates.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🎉 You've earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.pill,
  },
  topTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  errorCard: {
    backgroundColor: '#FEE2E2',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  errorText: { color: '#B91C1C', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
  },
  retryText: { fontWeight: '700', color: colors.text },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  certCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  awardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  certTitle: { ...typography.h3, fontSize: 16, marginBottom: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: 12, color: colors.textMuted },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  recipientText: { fontSize: 12, color: '#15803D', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  downloadBtnText: { fontSize: 14, fontWeight: '700', color: colors.text },
  viewBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cardSoft,
  },
  footer: {
    margin: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  footerText: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
