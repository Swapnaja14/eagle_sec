import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  FlatList, Image, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Star, Layers, Code2, Shield, BookOpen } from 'lucide-react-native';
import { coursesAPI, authAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

const CATEGORIES = [
  { key: 'all',   label: 'All',         icon: Layers },
  { key: 'cyber', label: 'Cybersecurity', icon: Shield },
  { key: 'iso',   label: 'Compliance',  icon: Code2 },
  { key: 'gen',   label: 'General',     icon: BookOpen },
];

// Cycling cover images for course cards (free Unsplash placeholders)
const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600',
  'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=600',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600',
];

const categorize = (c) => {
  const t = `${c.compliance_taxonomy || ''} ${c.skills_taxonomy || ''} ${c.display_name || ''}`.toLowerCase();
  if (t.includes('cyber') || t.includes('security')) return 'cyber';
  if (t.includes('iso') || t.includes('compliance') || t.includes('psara')) return 'iso';
  return 'gen';
};

export default function CatalogScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const [meRes, listRes] = await Promise.all([
        authAPI.me().catch(() => null),
        coursesAPI.list().catch(() => ({ data: { results: [] } })),
      ]);

      if (meRes) setMe(meRes.data);
      const list = listRes.data?.results || listRes.data || [];
      setCourses(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (activeCat !== 'all' && categorize(c) !== activeCat) return false;
      if (query && !c.display_name?.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [courses, activeCat, query]);

  const popular = courses.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

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
              <Text style={styles.hi}>Hi, {greetName}</Text>
              <Text style={styles.hiSub}>Embark on a personalized security training journey.</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.search}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search topics..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            <TouchableOpacity>
              <SlidersHorizontal size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Courses */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>Popular Courses</Text>
          <Text style={shared.sectionLink}>See All</Text>
        </View>
        <FlatList
          horizontal
          data={popular}
          keyExtractor={(it) => String(it.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.popCard}
              onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
            >
              <Image source={{ uri: COVER_IMAGES[index % COVER_IMAGES.length] }} style={styles.popImage} />
              <View style={{ padding: spacing.md }}>
                <Text style={styles.popTitle} numberOfLines={2}>{item.display_name}</Text>
                <View style={styles.popMeta}>
                  <Text style={styles.popMetaText}>by {item.created_by_name || 'EagleSec'}</Text>
                  <View style={styles.popRating}>
                    <Star size={11} color={colors.star} fill={colors.star} />
                    <Text style={styles.popRatingText}>4.9</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No popular courses yet.</Text>}
        />

        {/* Categories */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = activeCat === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setActiveCat(c.key)}
                style={[styles.catCard, active && styles.catCardActive]}
              >
                <View style={[styles.catIcon, active && { backgroundColor: colors.card }]}>
                  <Icon size={20} color={active ? colors.text : colors.text} />
                </View>
                <Text style={[styles.catLabel, active && { fontWeight: '700' }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Courses list */}
        <View style={shared.sectionHeader}>
          <Text style={shared.sectionTitle}>Courses</Text>
          <Text style={shared.sectionLink}>{filtered.length} found</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {filtered.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
            >
              <Image source={{ uri: COVER_IMAGES[idx % COVER_IMAGES.length] }} style={styles.rowImg} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle} numberOfLines={2}>{item.display_name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>by {item.created_by_name || 'EagleSec'}</Text>
                <View style={styles.rowFooter}>
                  <View style={styles.popRating}>
                    <Star size={11} color={colors.star} fill={colors.star} />
                    <Text style={styles.popRatingText}>4.9</Text>
                  </View>
                  <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>See Details</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {filtered.length === 0 && <Text style={styles.empty}>No courses match your filter.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  hi: { ...typography.h1, fontSize: 26 },
  hiSub: { ...typography.bodyMuted, color: '#3a3a3a', marginTop: 4 },
  avatar: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.pill,
  },
  search: {
    backgroundColor: colors.cardSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  popCard: {
    width: 200,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  popImage: { width: '100%', height: 110 },
  popTitle: { ...typography.h3, fontSize: 15, marginBottom: 6 },
  popMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popMetaText: { fontSize: 11, color: colors.textMuted },
  popRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  popRatingText: { fontSize: 12, fontWeight: '700', color: colors.text, marginLeft: 4 },
  catCard: {
    width: 90, height: 90,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.pill,
  },
  catCardActive: { backgroundColor: colors.primary },
  catIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  catLabel: { fontSize: 12, color: colors.text },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  rowImg: { width: 90, height: 90, borderRadius: radius.md },
  rowTitle: { ...typography.h3, fontSize: 14 },
  rowSub: { ...typography.small, marginTop: 2 },
  rowFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
});
