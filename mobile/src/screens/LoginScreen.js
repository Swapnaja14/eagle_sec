import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Code2, Compass, Wifi, Palette, ArrowRight } from 'lucide-react-native';
import { authAPI, baseURL } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

const CHIPS = [
  { label: 'Cybersecurity', icon: Code2,    top: 90,  left: 30 },
  { label: 'Compliance',    icon: Compass,  top: 90,  right: 30 },
  { label: 'Networking',    icon: Wifi,     top: 160, left: 20 },
  { label: 'Risk Mgmt',     icon: Palette,  top: 160, right: 20 },
];

export default function LoginScreen({ setIsLoggedIn }) {
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const showError = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const onLogin = async () => {
    if (!username || !password) {
      showError('Missing info', 'Enter both username and password.');
      return;
    }
    setBusy(true);
    try {
      await authAPI.login({ username: username.trim(), password });
      setIsLoggedIn(true);
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      let msg;
      if (status === 401) {
        msg = 'Invalid username or password.';
      } else if (status) {
        msg = `Server returned ${status}.\n${typeof data === 'string' ? data : JSON.stringify(data)}`;
      } else {
        // Network / CORS / wrong host
        msg =
          `Cannot reach backend at:\n${baseURL}\n\n` +
          `Make sure Django is running and reachable from this device.\n\n` +
          `Error: ${e?.message || 'Network Error'}`;
      }
      showError('Login failed', msg);
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <SafeAreaView style={[shared.screen, { backgroundColor: colors.primary }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Yellow hero */}
          <View style={styles.hero}>
            <Text style={styles.brand}>Eagle<Text style={{ color: colors.text }}>Sec</Text></Text>

            {CHIPS.map((c, i) => {
              const Icon = c.icon;
              return (
                <View
                  key={i}
                  style={[
                    styles.chip,
                    {
                      top: c.top,
                      ...(c.left ? { left: c.left } : {}),
                      ...(c.right ? { right: c.right } : {}),
                    },
                  ]}
                >
                  <Icon size={14} color={colors.text} />
                  <Text style={styles.chipText}>{c.label}</Text>
                </View>
              );
            })}

            <View style={styles.heroEmoji}>
              <Text style={{ fontSize: 120 }}>📚</Text>
            </View>
          </View>

          {/* White card with form / CTA */}
          <View style={styles.card}>
            {!showForm ? (
              <>
                <Text style={styles.headline}>LET'S LEARN WITH{'\n'}OUR EXCITING COURSES</Text>
                <Text style={styles.subhead}>
                  Excited to join your security training journey, making learning
                  easy and effective as we reach goals together.
                </Text>
                <TouchableOpacity style={styles.cta} onPress={() => setShowForm(true)}>
                  <Text style={styles.ctaText}>Get Started</Text>
                  <ArrowRight size={20} color={colors.text} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.headline}>Welcome back</Text>
                <Text style={styles.subhead}>Sign in to continue your training.</Text>

                <TextInput
                  placeholder="Username"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />

                <TouchableOpacity
                  style={[styles.cta, busy && { opacity: 0.6 }]}
                  onPress={onLogin}
                  disabled={busy}
                >
                  <Text style={styles.ctaText}>{busy ? 'Signing in…' : 'Sign In'}</Text>
                  <ArrowRight size={20} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowForm(false)} style={{ alignSelf: 'center', marginTop: spacing.md }}>
                  <Text style={{ color: colors.textMuted }}>Back</Text>
                </TouchableOpacity>

                <View style={styles.demoBox}>
                  <Text style={styles.demoTitle}>Demo accounts (tap to fill)</Text>
                  <TouchableOpacity onPress={() => fillDemo('trainee', 'trainee123')}>
                    <Text style={styles.demoLine}>trainee / trainee123</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => fillDemo('instructor', 'instructor123')}>
                    <Text style={styles.demoLine}>instructor / instructor123</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => fillDemo('admin', 'admin123')}>
                    <Text style={styles.demoLine}>admin / admin123</Text>
                  </TouchableOpacity>
                  <Text style={styles.hostHint}>API: {baseURL}</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 360,
    backgroundColor: colors.primary,
    paddingTop: spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  brand: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    color: colors.text,
  },
  heroEmoji: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
  },
  chip: {
    position: 'absolute',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadows.pill,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    marginTop: -28,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headline: {
    ...typography.h1,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subhead: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  ctaText: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
    backgroundColor: colors.cardSoft,
  },
  demoBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.cardSoft,
    borderRadius: radius.md,
  },
  demoTitle: {
    ...typography.label,
    marginBottom: 6,
  },
  demoLine: {
    fontSize: 12,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    paddingVertical: 4,
  },
  hostHint: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
