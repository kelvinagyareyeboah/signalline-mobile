import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Title */}
      <View style={styles.topSection}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to SignalLine</Text>
      </View>

      {/* Hero Illustration */}
      <View style={styles.heroSection}>
        <View style={[styles.heroCircle, { backgroundColor: colors.surfaceSubtle }]}>
          <FontAwesome name="shield" size={80} color={colors.accent} />
          <View style={[styles.miniBadge, { backgroundColor: colors.accent }]}>
            <FontAwesome name="map-marker" size={24} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.heroTagline, { color: colors.textSecondary }]}>
          Simple. Reliable. Private.
        </Text>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.bottomSection}>
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          Read our <Text style={[styles.linkText, { color: colors.accent }]}>Privacy Policy</Text>. Tap "Agree and continue" to accept the{' '}
          <Text style={[styles.linkText, { color: colors.accent }]}>Terms of Service</Text>.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push('/auth/phone')}>
          <Text style={styles.primaryButtonText}>Agree and continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  heroCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniBadge: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0B141A',
  },
  heroTagline: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomSection: {
    gap: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  linkText: {
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
