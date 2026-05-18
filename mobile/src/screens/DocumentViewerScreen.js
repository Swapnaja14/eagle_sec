import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';

// Conditional imports for native vs web
let WebView = null;
let FileSystem = null;
let Sharing = null;

if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
    FileSystem = require('expo-file-system');
    Sharing = require('expo-sharing');
  } catch (e) {
    console.warn('Native modules not available:', e);
  }
}

export default function DocumentViewerScreen({ navigation, route }) {
  const { documentUrl, title, filename, fileType } = route?.params || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      // For web, open in new tab to trigger browser download
      if (typeof window !== 'undefined' && documentUrl) {
        window.open(documentUrl, '_blank');
      }
      return;
    }

    if (!FileSystem || !Sharing) {
      Alert.alert('Error', 'Download not available on this platform');
      return;
    }

    try {
      setIsDownloading(true);
      
      const fileUri = FileSystem.documentDirectory + (filename || 'document.pdf');
      
      const downloadResumable = FileSystem.createDownloadResumable(
        documentUrl,
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
        Alert.alert('Success', 'Document downloaded successfully!');
      }
    } catch (err) {
      console.error('[DocumentViewer] Download error:', err);
      Alert.alert('Error', 'Failed to download document');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenExternal = async () => {
    if (!documentUrl) {
      Alert.alert('Error', 'Document URL not available');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(documentUrl);
      if (supported) {
        await Linking.openURL(documentUrl);
      } else {
        Alert.alert('Error', 'Cannot open this document type');
      }
    } catch (err) {
      console.error('[DocumentViewer] Open external error:', err);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  if (!documentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Viewer</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.errorContainer}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
            Document URL not available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // For web platform, use iframe or Google Docs Viewer
  const viewerUrl = Platform.OS === 'web' && fileType === 'pdf'
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`
    : documentUrl;

  // Render web version
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || 'Document Viewer'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
            <Download size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.documentContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
                Loading document...
              </Text>
            </View>
          )}
          
          <iframe
            src={viewerUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#fff',
            }}
            onLoad={() => setIsLoading(false)}
            title={title || 'Document'}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{filename || 'Document'}</Text>
          <Text style={styles.infoText}>
            Type: {fileType?.toUpperCase() || 'PDF'}
          </Text>
          <TouchableOpacity onPress={handleOpenExternal} style={styles.externalLinkBtn}>
            <ExternalLink size={14} color={colors.textMuted} />
            <Text style={styles.externalLinkText}>Open in new tab</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render native version
  if (!WebView) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Document Viewer</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.errorContainer}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
            WebView not available. Opening in browser...
          </Text>
          <TouchableOpacity onPress={handleOpenExternal} style={styles.openExternalBtn}>
            <ExternalLink size={16} color={colors.text} />
            <Text style={styles.openExternalText}>Open in Browser</Text>
          </TouchableOpacity>
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
            {title || 'Document Viewer'}
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

      <View style={styles.documentContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md }]}>
              Loading document...
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <FileText size={48} color={colors.textMuted} />
            <Text style={[typography.bodyMuted, { marginTop: spacing.md, textAlign: 'center' }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={handleOpenExternal} style={styles.openExternalBtn}>
              <ExternalLink size={16} color={colors.text} />
              <Text style={styles.openExternalText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && WebView && (
          <WebView
            source={{ uri: viewerUrl }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[DocumentViewer] WebView error:', nativeEvent);
              setError('Failed to load document. Try opening in browser.');
              setIsLoading(false);
            }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{filename || 'Document'}</Text>
        <Text style={styles.infoText}>
          Type: {fileType?.toUpperCase() || 'PDF'}
        </Text>
        <TouchableOpacity onPress={handleOpenExternal} style={styles.externalLinkBtn}>
          <ExternalLink size={14} color={colors.textMuted} />
          <Text style={styles.externalLinkText}>Open in external app</Text>
        </TouchableOpacity>
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
  documentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  openExternalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  infoTitle: {
    ...typography.h3,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodyMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  externalLinkText: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
