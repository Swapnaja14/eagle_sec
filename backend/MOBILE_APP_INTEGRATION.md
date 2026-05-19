# Mobile App Integration Guide

## Overview

This guide explains how to integrate the trainee mobile app with the backend API to fetch courses filtered by company (tenant) and department, including all videos and documents.

## API Endpoint

### Get Trainee Courses

**Endpoint:** `GET /api/courses/trainee-courses/`

**Authentication:** Required (JWT Bearer Token)

**Access:** Trainee role only

**Description:** Fetches all active courses that match the trainee's company and department, including all lesson files (videos, documents, presentations).

## Filtering Logic

The endpoint automatically filters courses based on:

1. **Tenant (Company):** Only courses belonging to the trainee's company
2. **Department:** Only courses matching the trainee's department (if set)
3. **Status:** Only active courses are returned
4. **Includes:** All lessons with their associated files

## Response Structure

```json
{
  "count": 3,
  "courses": [
    {
      "id": 1,
      "course_id": "CS-1-A1B2C3D4",
      "display_name": "Cybersecurity Fundamentals",
      "description": "Learn the basics of cybersecurity...",
      "status": "active",
      "compliance_taxonomy": "ISO 27001",
      "skills_taxonomy": "Threat Analysis",
      "department": "IT Security",
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "total_videos": 5,
      "total_documents": 8,
      "total_files": 13,
      "has_pre_assessment": true,
      "has_post_assessment": true,
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to Cybersecurity",
          "order": 1,
          "file_count": 3,
          "created_at": "2024-01-15T10:35:00Z",
          "files": [
            {
              "id": 1,
              "original_filename": "intro_video.mp4",
              "file": "/media/lesson_files/2024/01/intro_video.mp4",
              "file_type": "video",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2024-01-15T10:40:00Z"
            },
            {
              "id": 2,
              "original_filename": "lesson_notes.pdf",
              "file": "/media/lesson_files/2024/01/lesson_notes.pdf",
              "file_type": "document",
              "language": "en",
              "allow_offline_download": true,
              "uploaded_at": "2024-01-15T10:45:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

## React Native Implementation

### 1. Setup API Service

```javascript
// services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://your-server.com/api';

export const getTraineeCourses = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/courses/trainee-courses/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trainee courses:', error);
    throw error;
  }
};
```

### 2. Create Course List Component

```javascript
// screens/CoursesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { getTraineeCourses } from '../services/api';

const CoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    try {
      setError(null);
      const data = await getTraineeCourses();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => navigation.navigate('CourseDetail', { course: item })}
    >
      <Text style={styles.courseTitle}>{item.display_name}</Text>
      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Videos</Text>
          <Text style={styles.statValue}>{item.total_videos}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Documents</Text>
          <Text style={styles.statValue}>{item.total_documents}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Lessons</Text>
          <Text style={styles.statValue}>{item.lessons.length}</Text>
        </View>
      </View>
      
      {item.department && (
        <Text style={styles.department}>Department: {item.department}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No courses available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  department: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CoursesScreen;
```

### 3. Create Course Detail Component

```javascript
// screens/CourseDetailScreen.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';

const CourseDetailScreen = ({ route }) => {
  const { course } = route.params;

  const openFile = async (fileUrl) => {
    try {
      const fullUrl = `http://your-server.com${fileUrl}`;
      await Linking.openURL(fullUrl);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'video':
        return '🎥';
      case 'document':
        return '📄';
      case 'presentation':
        return '📊';
      default:
        return '📎';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{course.display_name}</Text>
        <Text style={styles.description}>{course.description}</Text>
        
        <View style={styles.metaContainer}>
          {course.department && (
            <Text style={styles.metaText}>Department: {course.department}</Text>
          )}
          {course.compliance_taxonomy && (
            <Text style={styles.metaText}>
              Compliance: {course.compliance_taxonomy}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.lessonsContainer}>
        <Text style={styles.sectionTitle}>Lessons</Text>
        
        {course.lessons.map((lesson, index) => (
          <View key={lesson.id} style={styles.lessonCard}>
            <Text style={styles.lessonTitle}>
              {lesson.order}. {lesson.title}
            </Text>
            
            {lesson.files.length > 0 && (
              <View style={styles.filesContainer}>
                {lesson.files.map((file) => (
                  <TouchableOpacity
                    key={file.id}
                    style={styles.fileItem}
                    onPress={() => openFile(file.file)}
                  >
                    <Text style={styles.fileIcon}>
                      {getFileIcon(file.file_type)}
                    </Text>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName}>
                        {file.original_filename}
                      </Text>
                      <Text style={styles.fileType}>
                        {file.file_type.toUpperCase()}
                        {file.allow_offline_download && ' • Downloadable'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  lessonsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  filesContainer: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: '#999',
  },
});

export default CourseDetailScreen;
```

## Key Features

### 1. Automatic Filtering
- Courses are automatically filtered by the trainee's company and department
- No need to pass filter parameters in the request

### 2. Complete Data
- All lessons are included
- All files (videos, documents, presentations) are included
- File metadata (type, language, download permissions) is provided

### 3. Optimized Response
- Includes summary statistics (total_videos, total_documents, total_files)
- Includes assessment availability flags
- Efficient database queries with prefetching

### 4. Security
- JWT authentication required
- Only trainees can access this endpoint
- Users can only see courses from their own company and department

## Testing

Run the test script to verify the endpoint:

```bash
cd backend
python test_trainee_courses_api.py
```

This will:
1. Login as a trainee user
2. Fetch courses from the endpoint
3. Display course details with videos and documents
4. Save the full response to a JSON file

## Error Handling

### 403 Forbidden
```json
{
  "detail": "This endpoint is only for trainees."
}
```
**Cause:** User is not a trainee

**Solution:** Ensure the authenticated user has the "trainee" role

### 401 Unauthorized
**Cause:** Missing or invalid authentication token

**Solution:** Include valid JWT token in Authorization header

## Best Practices

1. **Cache Responses:** Cache course data locally to reduce API calls
2. **Pull to Refresh:** Implement pull-to-refresh to get latest data
3. **Offline Support:** Download files marked with `allow_offline_download: true`
4. **Error Handling:** Handle network errors gracefully
5. **Loading States:** Show loading indicators during API calls

## Support

For issues or questions, refer to:
- Main API Documentation: `API_DOCUMENTATION.md`
- Architecture Overview: `ARCHITECTURE.md`
- Django Admin: `http://localhost:8000/admin/`
