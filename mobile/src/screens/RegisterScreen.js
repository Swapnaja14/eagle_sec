import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ArrowLeft, UserPlus } from 'lucide-react-native';
import { authAPI } from '../services/api';
import { colors, spacing, radius, typography, shared, shadows } from '../theme';

export default function RegisterScreen({ navigation, setIsLoggedIn }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    tenant_name: '',
    department: '',
  });
  const [busy, setBusy] = useState(false);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const showMsg = (title, msg) => {
    if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
    else Alert.alert(title, msg);
  };

  const onRegister = async () => {
    const { first_name, last_name, username, email, password, confirm_password, tenant_name, department } = form;

    if (!username || !email || !password || !confirm_password) {
      showMsg('Missing info', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirm_password) {
      showMsg('Password mismatch', 'Password and Confirm Password must match.');
      return;
    }
    if (password.length < 8) {
      showMsg('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (!tenant_name.trim()) {
      showMsg('Company required', 'Please enter your company name.');
      return;
    }
    if (!department.trim()) {
      showMsg('Department required', 'Please select or enter your department.');
      return;
    }

    setBusy(true);
    try {
      await authAPI.register({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password,
        role: 'trainee',
        tenant_name: tenant_name.trim(),
        department: department.trim(),
      });
      setIsLoggedIn(true);
    } catch (e) {
      const data = e?.response?.data;
      let msg;
      if (typeof data === 'string') {
        msg = data;
      } else if (typeof data === 'object') {
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      } else {
        msg = e?.message || 'Registration failed. Please try again.';
      }
      showMsg('Registration failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[shared.screen, { backgroundColor: colors.primary }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* Yellow header area */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.iconCircle}>
                <UserPlus size={32} color={colors.text} />
              </View>
              <Text style={styles.brand}>Create Account</Text>
              <Text style={styles.brandSub}>Join your company's training program</Text>
            </View>
          </View>

          {/* White card with form */}
          <View style={styles.card}>
            <View style={styles.row}>
              <TextInput
                placeholder="First Name"
                placeholderTextColor={colors.textMuted}
                value={form.first_name}
                onChangeText={(v) => set('first_name', v)}
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                value={form.last_name}
                onChangeText={(v) => set('last_name', v)}
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              placeholder="Username *"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={form.username}
              onChangeText={(v) => set('username', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Email *"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Company (e.g. VIT) *"
              placeholderTextColor={colors.textMuted}
              value={form.tenant_name}
              onChangeText={(v) => set('tenant_name', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Department (e.g. IT) *"
              placeholderTextColor={colors.textMuted}
              value={form.department}
              onChangeText={(v) => set('department', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Password (min 8 chars) *"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={form.password}
              onChangeText={(v) => set('password', v)}
              style={styles.input}
            />

            <TextInput
              placeholder="Confirm Password *"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={form.confirm_password}
              onChangeText={(v) => set('confirm_password', v)}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.cta, busy && { opacity: 0.6 }]}
              onPress={onRegister}
              disabled={busy}
            >
              <Text style={styles.ctaText}>{busy ? 'Creating account…' : 'Create Account'}</Text>
              <ArrowRight size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.switchLink}
            >
              <Text style={styles.switchText}>
                Already have an account? <Text style={styles.switchBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.pill,
  },
  headerCenter: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSub: {
    ...typography.bodyMuted,
    marginTop: 4,
    color: colors.text,
    opacity: 0.7,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    marginTop: -24,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
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
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  ctaText: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginRight: 8,
  },
  switchLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchText: {
    ...typography.bodyMuted,
  },
  switchBold: {
    fontWeight: '700',
    color: colors.text,
  },
});
