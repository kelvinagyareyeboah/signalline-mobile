import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/stores/useUserStore';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function OtpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const phoneNumber = useUserStore((state) => state.phoneNumber) || '+1 (555) 019-2834';
  const verifyOtp = useUserStore((state) => state.verifyOtp);

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerify = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) return;

    setIsVerifying(true);
    const isValid = await verifyOtp(codeToVerify);
    setIsVerifying(false);

    if (isValid) {
      router.replace('/auth/profile');
    } else {
      Alert.alert('Verification failed', 'Please enter a valid 6-digit code.');
      setCode('');
    }
  };

  const handleCodeChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) {
      handleVerify(cleaned);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top Section */}
        <View style={styles.topArea}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Verifying your number</Text>

          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Waiting to automatically detect an SMS sent to{' '}
            <Text style={[styles.boldPhone, { color: colors.text }]}>{phoneNumber}</Text>.{' '}
            <Text
              style={[styles.linkText, { color: colors.accent }]}
              onPress={() => router.back()}>
              Wrong number?
            </Text>
          </Text>

          {/* 6 Digit Input Display */}
          <View style={styles.codeContainer}>
            <TextInput
              style={styles.hiddenInput}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={handleCodeChange}
              autoFocus
            />

            <View style={styles.digitsRow}>
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const char = code[index] || '';
                const isCurrent = code.length === index;

                return (
                  <View
                    key={index}
                    style={[
                      styles.digitBox,
                      {
                        borderBottomColor: isCurrent ? colors.accent : colors.border,
                      },
                    ]}>
                    <Text style={[styles.digitChar, { color: colors.text }]}>
                      {char ? char : isCurrent ? '|' : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Enter 6-digit code
          </Text>

          {/* Resend Action */}
          <View style={styles.resendRow}>
            <FontAwesome name="envelope-o" size={14} color={colors.textSecondary} />
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: colors.textSecondary }]}>
                Resend SMS in 0:{countdown < 10 ? `0${countdown}` : countdown}
              </Text>
            ) : (
              <Pressable onPress={() => setCountdown(45)}>
                <Text style={[styles.resendLink, { color: colors.accent }]}>Resend SMS</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={({ pressed }) => [
              styles.verifyBtn,
              {
                backgroundColor: code.length === 6 ? colors.accent : colors.surfaceSubtle,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => handleVerify(code)}
            disabled={code.length !== 6 || isVerifying}>
            <Text
              style={[
                styles.verifyBtnText,
                { color: code.length === 6 ? '#FFFFFF' : colors.textMuted },
              ]}>
              {isVerifying ? 'Verifying...' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  boldPhone: {
    fontWeight: '700',
  },
  linkText: {
    fontWeight: '600',
  },
  codeContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 36,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  digitBox: {
    width: 38,
    height: 48,
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitChar: {
    fontSize: 24,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 13,
    marginTop: 18,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
    paddingVertical: 8,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyBtn: {
    width: 140,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
