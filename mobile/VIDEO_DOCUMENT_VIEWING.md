# Video & Document Viewing Features

## Overview
The mobile app now includes dedicated viewers for videos and documents (PDFs, presentations, documents) with platform-specific implementations for web and native.

## ✅ Features Implemented

### 1. **Document Viewer** (`DocumentViewerScreen.js`)
- View PDFs, documents, and presentations
- Platform-specific rendering:
  - **Web**: Uses iframe with Google Docs Viewer for PDFs
  - **Native**: Uses react-native-webview
- Download documents to device
- Share documents
- Open in external browser/app
- Loading states
- Error handling with fallback

**Supported File Types:**
- PDF (`.pdf`)
- Documents (`.doc`, `.docx`)
- Presentations (`.ppt`, `.pptx`)

### 2. **Video Viewer** (`VideoViewerScreen.js`)
- Play videos with native controls
- Platform-specific rendering:
  - **Web**: Uses HTML5 `<video>` element
  - **Native**: Uses expo-av Video component
- Download videos to device
- Share videos
- Video duration display
- Loading states
- Error handling

**Supported Video Types:**
- MP4 (`.mp4`)
- MOV (`.mov`)
- AVI (`.avi`)
- MKV (`.mkv`)
- WebM (`.webm`)

### 3. **Enhanced Lessons Screen**
- Automatic routing to appropriate viewer
- Color-coded material icons:
  - Videos: Red background
  - PDFs: Blue background
  - Others: Default
- "Tap to view" indicator for viewable materials
- Fallback to browser for images and other types

## 🎯 How It Works

### Material Type Detection
```javascript
const fileType = material?.file_type?.toLowerCase();

if (fileType === 'video') {
  // Navigate to VideoViewer
} else if (fileType === 'pdf' || fileType === 'document' || fileType === 'presentation') {
  // Navigate to DocumentViewer
} else {
  // Open in browser (for images, etc.)
}
```

### Platform-Specific Rendering

#### Web Platform
- **Documents**: iframe with Google Docs Viewer
- **Videos**: HTML5 video element
- **Downloads**: Opens in new tab

#### Native Platform
- **Documents**: react-native-webview
- **Videos**: expo-av Video component
- **Downloads**: expo-file-system + expo-sharing

## 📦 Dependencies

### Installed Packages
```json
{
  "expo-av": "~13.x.x",
  "expo-file-system": "~15.x.x",
  "expo-sharing": "~11.x.x",
  "react-native-webview": "^13.x.x"
}
```

### Conditional Imports
The viewers use conditional imports to work on both web and native:

```javascript
// Native only
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
```

## 🚀 Usage

### From LessonsScreen
```javascript
// Automatically routes to correct viewer
<TouchableOpacity onPress={() => handleOpenMaterial(material)}>
  <Text>{material.original_filename}</Text>
</TouchableOpacity>
```

### Direct Navigation
```javascript
// Document Viewer
navigation.navigate('DocumentViewer', {
  documentUrl: 'https://example.com/document.pdf',
  title: 'Course Material',
  filename: 'lesson1.pdf',
  fileType: 'pdf',
});

// Video Viewer
navigation.navigate('VideoViewer', {
  videoUrl: 'https://example.com/video.mp4',
  title: 'Training Video',
  filename: 'intro.mp4',
});
```

## 🎨 UI Features

### Document Viewer
- Yellow header with back button
- Download button (top right)
- Full-screen document view
- Info card showing:
  - Filename
  - File type
  - "Open in external app" link
- Loading overlay
- Error state with retry option

### Video Viewer
- Yellow header with back button
- Download button (top right)
- 16:9 aspect ratio video player
- Native playback controls
- Info card showing:
  - Filename
  - Video duration
- Loading overlay
- Error handling

## 🔧 Technical Details

### Web Implementation

#### Documents (iframe)
```javascript
<iframe
  src={viewerUrl}
  style={{ width: '100%', height: '100%', border: 'none' }}
  onLoad={() => setIsLoading(false)}
  title={title}
/>
```

#### Videos (HTML5)
```javascript
<video
  src={videoUrl}
  controls
  style={{ width: '100%', height: '100%' }}
  onLoadedData={() => setIsLoading(false)}
/>
```

### Native Implementation

#### Documents (WebView)
```javascript
<WebView
  source={{ uri: documentUrl }}
  onLoadEnd={() => setIsLoading(false)}
  onError={(e) => setError('Failed to load')}
/>
```

#### Videos (expo-av)
```javascript
<Video
  source={{ uri: videoUrl }}
  useNativeControls
  resizeMode="contain"
  onLoad={() => setIsLoading(false)}
  onPlaybackStatusUpdate={(status) => setStatus(status)}
/>
```

## 📱 Platform Differences

| Feature | Web | Native (iOS/Android) |
|---------|-----|---------------------|
| Document Viewing | iframe + Google Docs | WebView |
| Video Playback | HTML5 video | expo-av Video |
| Downloads | Opens in new tab | FileSystem + Sharing |
| Offline Support | No | Yes (with downloads) |
| Native Controls | Browser controls | Native video controls |

## 🛡️ Error Handling

### Document Viewer
- WebView load errors → Show "Open in Browser" button
- Missing URL → Show error message
- Download failures → Alert with error message

### Video Viewer
- Playback errors → Alert with error message
- Missing URL → Show error message
- Download failures → Alert with error message

### Fallback Strategy
1. Try to load in viewer
2. If error, show "Open in Browser/External App" button
3. User can manually open in system browser/app

## 🎯 User Experience

### Material Cards in Lessons
```
┌─────────────────────────────────────┐
│ 📄 Introduction.pdf                 │
│ pdf • en • Tap to view         →   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🎥 Training Video.mp4               │
│ video • en • Tap to view       →   │
└─────────────────────────────────────┘
```

### Document Viewer
```
┌─────────────────────────────────────┐
│ ← Introduction.pdf            ⬇    │
├─────────────────────────────────────┤
│                                     │
│     [Document Content Here]         │
│                                     │
├─────────────────────────────────────┤
│ Introduction.pdf                    │
│ Type: PDF                           │
│ 🔗 Open in external app             │
└─────────────────────────────────────┘
```

### Video Viewer
```
┌─────────────────────────────────────┐
│ ← Training Video                ⬇  │
├─────────────────────────────────────┤
│                                     │
│     [Video Player with Controls]    │
│                                     │
├─────────────────────────────────────┤
│ intro.mp4                           │
│ Duration: 5:30                      │
└─────────────────────────────────────┘
```

## 🔐 Security Considerations

### URL Validation
- All URLs are validated before loading
- HTTPS preferred for external resources
- Backend URLs are trusted

### Download Safety
- Downloads only on user action
- File type validation
- Secure storage in app directory

## 📊 Performance

### Optimization
- Lazy loading of native modules
- Conditional imports for platform
- Loading states prevent UI blocking
- Error boundaries prevent crashes

### Caching
- Native: Files can be downloaded and cached
- Web: Browser handles caching

## 🐛 Troubleshooting

### "Cannot find module 'react-native-webview'"
**Solution**: Packages are conditionally imported. On web, this is expected and handled gracefully.

### "Video won't play"
**Possible causes:**
- Unsupported video format
- Network issues
- CORS restrictions (web)

**Solutions:**
- Check video URL is accessible
- Try opening in external browser
- Verify video format is supported

### "Document won't load"
**Possible causes:**
- PDF too large
- Network issues
- CORS restrictions (web)

**Solutions:**
- Use "Open in Browser" button
- Check document URL is accessible
- Try downloading instead

## 🎉 Benefits

1. **Seamless Experience**: View materials without leaving the app
2. **Platform Optimized**: Uses best technology for each platform
3. **Offline Support**: Download for offline viewing (native)
4. **User Friendly**: Clear loading and error states
5. **Flexible**: Fallback to browser if viewer fails
6. **Consistent UI**: Matches app design system
7. **Safe**: Defensive coding prevents crashes

## 📝 Future Enhancements

Potential improvements:
- [ ] Offline mode with local storage
- [ ] Bookmarks for documents
- [ ] Video playback speed control
- [ ] Picture-in-picture for videos
- [ ] Document annotations
- [ ] Progress tracking
- [ ] Resume playback from last position
- [ ] Subtitles/captions support
- [ ] Multiple quality options for videos

## 🔗 Related Files

- `mobile/src/screens/DocumentViewerScreen.js`
- `mobile/src/screens/VideoViewerScreen.js`
- `mobile/src/screens/LessonsScreen.js`
- `mobile/src/navigation/AppNavigator.js`
