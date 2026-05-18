import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Download } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';

// Conditional imports for native vs web
let Video = null;
let FileSystem = null;
let Sharing = null;

if (Platform.OS !== 'web') {
  try {
    const ExpoAV = require('expo-av');
    Video = ExpoAV.Video;
    FileSystem = require('expo-file-system');
    Sharing = require('expo-sharing');
  } catch (e) {
    console.warn('Native modules not available:', e);
  }
}

const { width } = Dimensions.get('window');

export default function VideoViewerScreen({ navigation, route }) {
  const { videoUrl, title, filename } = route?.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState({});

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      // For web, open in new tab to trigger browser download
      if (typeof window !== 'undefined' && videoUrl) {
        window.open(videoUrl, '_blank');
      }
      return;
    }

    if (!FileSystem || !Sharing) {
      Alert.alert('Error', 'Download not available on this platform');
      return;
    }

    try {
      setIsDownloading(true);
      
      const fileUri = FileSystem.documentDirectory + (filename || 'video.mp4');
      
      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${(progress * 100).toFixed(0)}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'Video downloaded successfully!');
      }
    } catch (err) {
      console.error('[VideoViewer] Download error:', err);
      Alert.alert('Error', 'Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!videoUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Player</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={typography.bodyMuted}>Video URL not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render web version with HTML5 video
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || 'Video Player'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
            <Download size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          <video
            src={videoUrl}
            controls
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadedData={() => setIsLoading(false)}
          >
            Your browser does not support the video tag.
          </video>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{filename || 'Video'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render native version
  if (!Video) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Player</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={typography.bodyMuted}>Video player not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: spacing.md }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Video Player'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleDownload} 
          style={styles.iconBtn}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Download size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              Loading video...
            </Text>
          </View>
        )}
        
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          isLooping={false}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(error) => {
            console.error('[VideoViewer] Playback error:', error);
            setIsLoading(false);
            Alert.alert('Error', 'Failed to load video');
          }}
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{filename || 'Video'}</Text>
        {status?.durationMillis && (
          <Text style={styles.infoText}>
            Duration: {Math.floor(status.durationMillis / 60000)}:
            {String(Math.floor((status.durationMillis % 60000) / 1000)).padStart(2, '0')}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.pill,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16), // 16:9 aspect ratio
    backgroundColor: '#000',
    marginTop: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.card,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  infoTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodyMuted,
    fontSize: 13,
  },
});
