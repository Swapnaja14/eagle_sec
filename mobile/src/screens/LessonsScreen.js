import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, FileText, Video, Image as ImageIcon, Link as LinkIcon, Download, ExternalLink,
} from 'lucide-react-native';
import { coursesApi } from '../api/courses.api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function LessonsScreen({ navigation, route }) {
  const { courseId, courseName } = route.params || {};
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadLessons = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const data = await coursesApi.getCourseLessons(courseId);
      setLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[LessonsScreen] Load error:', err);
      setError(err?.message || 'Failed to load lessons');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadLessons();
    }
  }, [courseId, loadLessons]);

  const handleOpenMaterial = useCallback((material) => {
    if (!material?.file) {
      Alert.alert('Error', 'Material file not available');
      return;
    }

    const fileType = material?.file_type?.toLowerCase();
    const filename = material?.original_filename || 'file';
    const title = material?.original_filename || 'Study Material';

    // Route to appropriate viewer based on file type
    if (fileType === 'video') {
      navigation.navigate('VideoViewer', {
        videoUrl: material.file,
        title,
        filename,
      });
    } else if (fileType === 'pdf' || fileType === 'document' || fileType === 'presentation') {
      navigation.navigate('DocumentViewer', {
        documentUrl: material.file,
        title,
        filename,
        fileType,
      });
    } else {
      // For images and other types, open in browser
      Linking.openURL(material.file).catch(() => {
        Alert.alert('Error', 'Failed to open material');
      });
    }
  }, [navigation]);

  const getMaterialIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'video':
        return Video;
      case 'pdf':
      case 'document':
        return FileText;
      case 'image':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} size="large" />
        <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>Loading lessons...</Text>
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
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.topTitle}>Course Lessons</Text>
          {courseName && <Text style={styles.subtitle} numberOfLines={1}>{courseName}</Text>}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadLessons(true)} tintColor={colors.text} />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadLessons()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && lessons.length === 0 && (
          <View style={styles.empty}>
            <FileText size={48} color={colors.textMuted} />
            <Text style={[typography.h3, { marginTop: spacing.md }]}>No Lessons Yet</Text>
            <Text style={[typography.bodyMuted, { marginTop: spacing.sm, textAlign: 'center' }]}>
              Lessons and study materials will appear here once added by your trainer.
            </Text>
          </View>
        )}

        {lessons.map((lesson, index) => (
          <View key={lesson?.id || index} style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <View style={styles.lessonNumber}>
                <Text style={styles.lessonNumberText}>{lesson?.order || index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonTitle}>{lesson?.title || 'Untitled Lesson'}</Text>
                {lesson?.description && (
                  <Text style={styles.lessonDesc} numberOfLines={2}>{lesson.description}</Text>
                )}
              </View>
            </View>

            {/* Study Materials */}
            {lesson?.files && lesson.files.length > 0 && (
              <View style={styles.materialsSection}>
                <Text style={styles.materialsTitle}>Study Materials ({lesson.files.length})</Text>
                {lesson.files.map((material, matIndex) => {
                  const Icon = getMaterialIcon(material?.file_type);
                  const fileType = material?.file_type?.toLowerCase();
                  const isViewable = fileType === 'video' || fileType === 'pdf' || 
                                    fileType === 'document' || fileType === 'presentation';
                  
                  return (
                    <TouchableOpacity
                      key={material?.id || matIndex}
                      style={styles.materialRow}
                      onPress={() => handleOpenMaterial(material)}
                    >
                      <View style={[
                        styles.materialIcon,
                        fileType === 'video' && { backgroundColor: '#FEE2E2' },
                        fileType === 'pdf' && { backgroundColor: '#DBEAFE' },
                      ]}>
                        <Icon 
                          size={18} 
                          color={
                            fileType === 'video' ? '#B91C1C' :
                            fileType === 'pdf' ? '#1E40AF' :
                            colors.text
                          } 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.materialName} numberOfLines={1}>
                          {material?.original_filename || 'Unnamed File'}
                        </Text>
                        <Text style={styles.materialType}>
                          {material?.file_type || 'document'} • {material?.language || 'en'}
                          {isViewable && ' • Tap to view'}
                        </Text>
                      </View>
                      <ExternalLink size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {(!lesson?.files || lesson.files.length === 0) && (
              <View style={styles.noMaterials}>
                <Text style={typography.small}>No study materials available yet</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
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
  lessonCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  lessonNumber: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  lessonNumberText: { fontWeight: '800', color: colors.text, fontSize: 16 },
  lessonTitle: { ...typography.h3, fontSize: 16, marginBottom: 4 },
  lessonDesc: { ...typography.bodyMuted, fontSize: 13 },
  materialsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  materialsTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  materialIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  materialName: { fontWeight: '600', color: colors.text, fontSize: 13 },
  materialType: { fontSize: 11, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  noMaterials: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
});
