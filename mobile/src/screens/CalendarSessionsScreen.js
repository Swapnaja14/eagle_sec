import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar as CalIcon, Clock, MapPin, User, ExternalLink, ChevronLeft,
} from 'lucide-react-native';
import { sessionsAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDay = (d) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
const fmtMonth = (d) => d.toLocaleDateString([], { month: 'long', year: 'numeric' });

const groupByDay = (sessions) => {
  const groups = {};
  for (const s of sessions) {
    const d = new Date(s.start_time || s.date_time || s.start || s.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    if (!groups[key]) groups[key] = { date: d, items: [] };
    groups[key].items.push({ ...s, _date: d });
  }
  return Object.values(groups).sort((a, b) => a.date - b.date);
};

export default function CalendarSessionsScreen({ navigation }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');

      let list = [];
      try {
        const r = await sessionsAPI.upcoming();
        list = r.data?.results || r.data || [];
      } catch {
        list = [];
      }
      if (!list.length) {
        try {
          const r = await sessionsAPI.calendar();
          list = r.data?.results || r.data || [];
        } catch {
          list = [];
        }
      }
      setSessions(Array.isArray(list) ? list : []);
    } catch (e) {
      setError('Could not load sessions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => groupByDay(sessions), [sessions]);
  const monthLabel = grouped[0] ? fmtMonth(grouped[0].date) : 'Upcoming';

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={styles.iconBtn}>
          <ChevronLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
        <View style={[styles.iconBtn, { backgroundColor: colors.card }]}>
          <CalIcon size={18} color={colors.text} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.text} />}
        >
          {error ? (
            <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: spacing.xl }]}>{error}</Text>
          ) : null}

          {grouped.length === 0 ? (
            <View style={styles.empty}>
              <CalIcon size={36} color={colors.textMuted} />
              <Text style={[typography.h3, { marginTop: spacing.md }]}>No upcoming sessions</Text>
              <Text style={[typography.bodyMuted, { marginTop: 4, textAlign: 'center' }]}>
                When trainers schedule sessions you'll see them here.
              </Text>
            </View>
          ) : (
            grouped.map((g) => (
              <View key={g.date.toISOString()} style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
                <View style={styles.dayHead}>
                  <View style={styles.dayChip}>
                    <Text style={styles.dayNum}>{g.date.getDate()}</Text>
                    <Text style={styles.dayMon}>
                      {g.date.toLocaleDateString([], { month: 'short' }).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.dayLabel}>{fmtDay(g.date)}</Text>
                    <Text style={styles.dayCount}>{g.items.length} session{g.items.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>

                {g.items.map((s, i) => (
                  <SessionCard key={s.id || `${s.topic}-${i}`} s={s} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SessionCard({ s }) {
  const start = s._date;
  const dur = s.duration_minutes ?? 60;
  const end = new Date(start.getTime() + dur * 60000);
  const link = s.meeting_link || s.location_url;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Clock size={14} color={colors.text} />
        <Text style={styles.cardTime}>{fmtTime(start)}</Text>
        <Text style={styles.cardEnd}>{fmtTime(end)}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.cardTitle} numberOfLines={2}>{s.topic || s.title || 'Training Session'}</Text>
        {s.trainer_name ? (
          <View style={styles.metaRow}>
            <User size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{s.trainer_name}</Text>
          </View>
        ) : null}
        {s.venue || s.location ? (
          <View style={styles.metaRow}>
            <MapPin size={12} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{s.venue || s.location}</Text>
          </View>
        ) : null}
        {link ? (
          <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.joinBtn}>
            <ExternalLink size={12} color={colors.text} />
            <Text style={styles.joinText}>Join</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.pill,
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, color: '#3a3a3a', marginTop: 2 },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    margin: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.pill,
  },
  dayHead: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.md,
  },
  dayChip: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  dayNum: { fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 22 },
  dayMon: { fontSize: 10, fontWeight: '800', color: colors.text, letterSpacing: 0.6 },
  dayLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  dayCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.pill,
  },
  cardLeft: {
    width: 64,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTime: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 4 },
  cardEnd: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  cardTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textMuted, marginLeft: 6 },
  joinBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  joinText: { fontSize: 12, fontWeight: '700', color: colors.text, marginLeft: 4 },
});
