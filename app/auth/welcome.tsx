import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Slide {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  badgeIcon: React.ComponentProps<typeof FontAwesome>['name'];
  tagline: string;
  title: string;
  description: string;
}

const ONBOARDING_SLIDES: Slide[] = [
  {
    icon: 'comments',
    badgeIcon: 'lock',
    tagline: 'PRIVATE & ENCRYPTED CHAT',
    title: 'Fast, Reliable Messaging',
    description:
      'Chat directly with friends and family. Enjoy WhatsApp-style real-time read receipts, voice memos, and an offline outbox engine that delivers messages the instant you reconnect.',
  },
  {
    icon: 'map-marker',
    badgeIcon: 'compass',
    tagline: 'REAL-TIME LIVE GPS',
    title: 'Live Location Sharing',
    description:
      'Broadcast your coordinates on an interactive live map. Share your journey with trusted contacts for 15 minutes, 1 hour, or until you choose to stop.',
  },
  {
    icon: 'shield',
    badgeIcon: 'crosshairs',
    tagline: 'GEOSPATIAL RADAR',
    title: 'Accra Proximity & ETAs',
    description:
      'See nearby contacts on the live Accra radar, monitor arrival times in real-time, and maintain complete control over who can track your live position.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[currentSlide];

  const handleNext = () => {
    if (!isLastSlide) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      router.push('/auth/phone');
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    router.push('/auth/phone');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Row with Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <FontAwesome name="signal" size={18} color={colors.accent} />
          <Text style={[styles.brandText, { color: colors.text }]}>SignalLine</Text>
        </View>

        {!isLastSlide ? (
          <Pressable onPress={handleSkip} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Main Slide Content Card */}
      <View style={styles.slideContent}>
        {/* Visual Hero Badge */}
        <View style={[styles.heroCircle, { backgroundColor: colors.surfaceSubtle }]}>
          <FontAwesome name={slide.icon} size={76} color={colors.accent} />
          <View style={[styles.miniBadge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
            <FontAwesome name={slide.badgeIcon} size={20} color="#FFFFFF" />
          </View>
        </View>

        {/* Tagline Badge */}
        <View style={[styles.taglineChip, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.taglineText, { color: colors.accent }]}>{slide.tagline}</Text>
        </View>

        {/* Slide Title & Description */}
        <Text style={[styles.slideTitle, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{slide.description}</Text>
      </View>

      {/* Bottom Controls Area */}
      <View style={styles.bottomArea}>
        {/* Slide Indicator Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <Pressable
                key={index}
                onPress={() => setCurrentSlide(index)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.accent : colors.border,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Legal disclaimer only on last slide */}
        {isLastSlide && (
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            Read our <Text style={[styles.linkText, { color: colors.accent }]}>Privacy Policy</Text>. Tap "Agree and continue" to accept the{' '}
            <Text style={[styles.linkText, { color: colors.accent }]}>Terms of Service</Text>.
          </Text>
        )}

        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          {currentSlide > 0 && !isLastSlide && (
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                { borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleBack}>
              <FontAwesome name="chevron-left" size={14} color={colors.textSecondary} />
              <Text style={[styles.backBtnText, { color: colors.text }]}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: colors.accent,
                flex: currentSlide > 0 && !isLastSlide ? 1 : undefined,
                width: currentSlide === 0 || isLastSlide ? '100%' : undefined,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleNext}>
            <Text style={styles.primaryBtnText}>
              {isLastSlide ? 'Agree and continue' : 'Next'}
            </Text>
            {!isLastSlide && <FontAwesome name="chevron-right" size={14} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 28,
  },
  miniBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  taglineChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  slideDesc: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  bottomArea: {
    gap: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  termsText: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  linkText: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
