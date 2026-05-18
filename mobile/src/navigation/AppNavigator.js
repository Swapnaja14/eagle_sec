import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { CourseDetailScreen } from '../screens/courses/CourseDetailScreen';
import LessonsScreen from '../screens/LessonsScreen';
import AssignmentsScreen from '../screens/AssignmentsScreen';
import CertificatesScreen from '../screens/CertificatesScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import VideoViewerScreen from '../screens/VideoViewerScreen';
import { COLORS } from '../utils/constants';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const Stack = createStackNavigator();

const linking = {
  prefixes: [],
  config: {
    screens: {
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Courses: 'courses',
          Profile: 'profile',
        },
      },
      CourseDetail: 'course/:id',
      Lessons: 'lessons/:courseId',
      Assignments: 'assignments',
      Certificates: 'certificates',
      DocumentViewer: 'document-viewer',
      VideoViewer: 'video-viewer',
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};

export const AppNavigator = () => {
  console.log('[AppNavigator] Rendering...');
  
  const { isAuthenticated, isLoading, error } = useAuth();

  console.log('[AppNavigator] Auth state:', { isAuthenticated, isLoading, error });

  if (isLoading) {
    console.log('[AppNavigator] Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('[AppNavigator] Auth error:', error);
  }

  console.log('[AppNavigator] Rendering navigation, authenticated:', isAuthenticated);

  return (
    <NavigationContainer
      linking={linking}
      fallback={
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      }
      onReady={() => console.log('[NavigationContainer] Ready')}
      onStateChange={(state) => console.log('[NavigationContainer] State changed:', state?.index)}
    >
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={{ title: 'Course Details' }}
          />
          <Stack.Screen
            name="Lessons"
            component={LessonsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Assignments"
            component={AssignmentsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Certificates"
            component={CertificatesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DocumentViewer"
            component={DocumentViewerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoViewer"
            component={VideoViewerScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
