import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Video, FileText, Play, Download, X,
  Maximize, Gauge,
} from 'lucide-react-native';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import { lessonsAPI, baseURL } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function LessonDetailScreen({ navigation, route }) {
  const { courseId, lessonId, lessonTitle, files: routeFiles } = route.params || {};

  const [activeTab, setActiveTab] = useState('videos');
  const [files, setFiles] = useState(routeFiles || []);
  const [loading, setLoading] = useState(!routeFiles || routeFiles.length === 0);
  const [playingId, setPlayingId] = useState(null);   // inline card playback
  const [modalVideo, setModalVideo] = useState(null);  // fullscreen modal
  const [speed, setSpeed] = useState(1);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const inlineRef = useRef(null);
  const modalRef = useRef(null);

  // If files weren't passed via route params, fetch from API
  useEffect(() => {
    if (routeFiles && routeFiles.length > 0) return;
    let mounted = true;
    (async () => {
      try {
        const res = await lessonsAPI.files(courseId, lessonId);
        const list = res.data?.results || res.data || [];
        if (mounted) setFiles(list);
      } catch (e) {
        console.log('Failed to fetch lesson files:', e?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [courseId, lessonId, routeFiles]);

  const videos = files.filter(f => f.file_type === 'video');
  const notes = files.filter(f => f.file_type !== 'video');

  // Resolve absolute file URL (backend may return relative path)
  const resolveUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    // Strip /api from baseURL to get the root domain
    const root = baseURL.replace(/\/api\/?$/, '');
    return `${root}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  const openDocument = async (file) => {
    const url = resolveUrl(file.file);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await WebBrowser.openBrowserAsync(url);
    }
  };

  const goFullscreen = async (file) => {
    // Pause inline player, then open modal
    if (inlineRef.current) {
      try { await inlineRef.current.pauseAsync(); } catch {}
    }
    setSpeed(1);
    setShowSpeedPicker(false);
    setModalVideo(file);
  };

  const closePlayer = useCallback(() => {
    setModalVideo(null);
    setShowSpeedPicker(false);
  }, []);

  const changeSpeed = async (s) => {
    setSpeed(s);
    setShowSpeedPicker(false);
    if (modalRef.current) {
      await modalRef.current.setRateAsync(s, true);
    }
  };

  // ---------- rendering ----------

  if (loading) {
    return (
      <SafeAreaView style={[shared.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={shared.screen} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{lessonTitle || 'Lesson'}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
          onPress={() => setActiveTab('videos')}
        >
          <Video size={16} color={activeTab === 'videos' ? colors.text : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
            Videos ({videos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <FileText size={16} color={activeTab === 'notes' ? colors.text : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            Notes ({notes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'videos' ? (
          videos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Video size={36} color={colors.textMuted} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
                No videos available for this lesson yet.
              </Text>
            </View>
          ) : (
            videos.map((v) => (
              <View key={v.id} style={styles.fileCard}>
                {/* Inline player or thumbnail */}
                {playingId === v.id ? (
                  <View style={styles.inlinePlayerWrap}>
                    <ExpoVideo
                      ref={inlineRef}
                      source={{ uri: resolveUrl(v.file) }}
                      style={styles.inlinePlayer}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.videoThumb}
                    onPress={() => setPlayingId(v.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.playCircle}>
                      <Play size={28} color={colors.text} fill={colors.text} />
                    </View>
                    <Text style={styles.tapToPlay}>Tap to play</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.fileInfo}>
                  <Video size={16} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={2}>{v.original_filename}</Text>
                    {v.language && (
                      <Text style={styles.fileLang}>Language: {v.language.toUpperCase()}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => goFullscreen(v)}
                    style={styles.fullscreenBtn}
                  >
                    <Maximize size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          notes.length === 0 ? (
            <View style={styles.emptyCard}>
              <FileText size={36} color={colors.textMuted} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
                No notes or documents available for this lesson yet.
              </Text>
            </View>
          ) : (
            notes.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={styles.fileCard}
                onPress={() => openDocument(n)}
              >
                <View style={styles.fileInfo}>
                  <View style={styles.docIcon}>
                    <FileText size={22} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={2}>{n.original_filename}</Text>
                    <Text style={styles.fileType}>
                      {n.file_type === 'presentation' ? 'Presentation' : 'Document'}
                      {n.language ? ` • ${n.language.toUpperCase()}` : ''}
                    </Text>
                  </View>
                  <Download size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>

      {/* ===== Fullscreen Video Modal ===== */}
      <Modal
        visible={!!modalVideo}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={closePlayer}
      >
        <View style={styles.modalBg}>
          <StatusBar hidden />

          {/* Video */}
          <ExpoVideo
            ref={modalRef}
            source={modalVideo ? { uri: resolveUrl(modalVideo.file) } : undefined}
            style={styles.fullscreenVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            rate={speed}
            volume={1.0}
          />

          {/* Top controls overlay */}
          <View style={styles.modalTopBar}>
            <TouchableOpacity onPress={closePlayer} style={styles.modalBtn}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {modalVideo?.original_filename}
            </Text>
            <TouchableOpacity
              onPress={() => setShowSpeedPicker((v) => !v)}
              style={styles.modalBtn}
            >
              <Gauge size={20} color="#fff" />
              <Text style={styles.speedLabel}>{speed}x</Text>
            </TouchableOpacity>
          </View>

          {/* Speed picker dropdown */}
          {showSpeedPicker && (
            <View style={styles.speedPicker}>
              {SPEEDS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedOption, s === speed && styles.speedOptionActive]}
                  onPress={() => changeSpeed(s)}
                >
                  <Text style={[styles.speedText, s === speed && styles.speedTextActive]}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
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
  topTitle: {
    fontSize: 16, fontWeight: '800', color: colors.text,
    flex: 1, textAlign: 'center', marginHorizontal: spacing.sm,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 4,
    ...shadows.pill,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14, fontWeight: '600', color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.text, fontWeight: '800',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.pill,
  },
  fileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  videoThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  tapToPlay: {
    color: '#aaa', fontSize: 12, marginTop: 8,
  },
  inlinePlayerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  inlinePlayer: {
    width: '100%',
    height: '100%',
  },
  fullscreenBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  docIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    backgroundColor: colors.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  fileName: {
    flex: 1, fontWeight: '700', fontSize: 14, color: colors.text,
  },
  fileType: {
    fontSize: 12, color: colors.textMuted, marginTop: 2,
  },
  fileLang: {
    fontSize: 11, color: colors.textMuted, marginTop: 2,
  },

  // ===== Fullscreen modal =====
  modalBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  modalTopBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  speedLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  speedPicker: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 82,
    right: spacing.lg,
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: radius.md,
    paddingVertical: 6,
    minWidth: 80,
    zIndex: 20,
  },
  speedOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  speedOptionActive: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    marginHorizontal: 4,
  },
  speedText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
  },
  speedTextActive: {
    color: colors.text,
    fontWeight: '800',
  },
});
