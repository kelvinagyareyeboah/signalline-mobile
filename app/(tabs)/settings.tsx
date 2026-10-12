import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/stores/useUserStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useChatStore } from '../../src/stores/useChatStore';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LocationDuration, LocationAccuracySetting } from '../../src/types';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const user = useUserStore((state) => state.user);
  const phoneNumber = useUserStore((state) => state.phoneNumber);
  const logout = useUserStore((state) => state.logout);
  const themePreference = useUserStore((state) => state.themePreference);
  const setThemePreference = useUserStore((state) => state.setThemePreference);

  const notifications = useSettingsStore((state) => state.notifications);
  const setNotificationCategory = useSettingsStore((state) => state.setNotificationCategory);
  const defaultLocationDuration = useSettingsStore((state) => state.defaultLocationDuration);
  const setDefaultLocationDuration = useSettingsStore((state) => state.setDefaultLocationDuration);
  const defaultLocationAccuracy = useSettingsStore((state) => state.defaultLocationAccuracy);
  const setDefaultLocationAccuracy = useSettingsStore((state) => state.setDefaultLocationAccuracy);

  const socketState = useChatStore((state) => state.socketState);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of SignalLine on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* WhatsApp-Style Profile Header */}
        <Pressable
          style={[styles.profileHeader, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/auth/profile')}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
              {phoneNumber ? phoneNumber : 'Hey there! I am using SignalLine'}
            </Text>
          </View>

          <FontAwesome name="qrcode" size={22} color={colors.accent} />
        </Pressable>

        {/* Section 1: Privacy & Live Location Defaults */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>PRIVACY & LOCATION</Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Default Share Duration</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {defaultLocationDuration === 0 ? 'Indefinite' : `${defaultLocationDuration} minutes`}
              </Text>
            </View>
            <View style={styles.segmentedRow}>
              {([15, 60, 0] as LocationDuration[]).map((dur) => (
                <Pressable
                  key={dur}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        defaultLocationDuration === dur ? colors.accent : colors.surfaceSubtle,
                    },
                  ]}
                  onPress={() => setDefaultLocationDuration(dur)}>
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color: defaultLocationDuration === dur ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: defaultLocationDuration === dur ? '700' : '500',
                      },
                    ]}>
                    {dur === 0 ? 'Off' : `${dur}m`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextCol}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>GPS Accuracy Level</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>
                {defaultLocationAccuracy === 'high' ? 'High Precision (GPS)' : 'Balanced (Battery Saver)'}
              </Text>
            </View>
            <View style={styles.segmentedRow}>
              {(['balanced', 'high'] as LocationAccuracySetting[]).map((acc) => (
                <Pressable
                  key={acc}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        defaultLocationAccuracy === acc ? colors.accent : colors.surfaceSubtle,
                    },
                  ]}
                  onPress={() => setDefaultLocationAccuracy(acc)}>
                  <Text
                    style={[
                      styles.segmentBtnText,
                      {
                        color: defaultLocationAccuracy === acc ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: defaultLocationAccuracy === acc ? '700' : '500',
                      },
                    ]}>
                    {acc === 'high' ? 'High' : 'Balanced'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Section 2: Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>NOTIFICATIONS</Text>

          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Message Notifications</Text>
            <Switch
              value={notifications.newMessages}
              onValueChange={(val) => setNotificationCategory('newMessages', val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Location Share Alerts</Text>
            <Switch
              value={notifications.locationRequests}
              onValueChange={(val) => setNotificationCategory('locationRequests', val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </View>

        {/* Section 3: Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>APPEARANCE</Text>

          <View style={styles.themeRow}>
            {(['dark', 'light', 'system'] as const).map((t) => {
              const isSelected = themePreference === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setThemePreference(t)}>
                  <Text
                    style={[
                      styles.themeBtnText,
                      {
                        color: isSelected ? colors.accent : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 4: Network & Connection */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: colors.accent }]}>CONNECTION</Text>
          <View style={styles.networkRow}>
            <View style={styles.statusDotRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      socketState === 'connected'
                        ? colors.online
                        : socketState === 'reconnecting'
                        ? colors.away
                        : colors.danger,
                  },
                ]}
              />
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {socketState === 'connected'
                  ? 'Real-Time Server Connected'
                  : socketState === 'reconnecting'
                  ? 'Connecting...'
                  : 'Offline (SQLite Outbox Active)'}
              </Text>
            </View>
            <Text style={[styles.portText, { color: colors.textSecondary }]}>Port 4000</Text>
          </View>
        </View>

        {/* WhatsApp-Style Log Out Button */}
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
          onPress={handleLogout}>
          <FontAwesome name="sign-out" size={17} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  profileBio: {
    fontSize: 13.5,
    marginTop: 3,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  settingRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15.5,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 13,
    marginTop: 2,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  segmentBtnText: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: {
    fontSize: 14,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  portText: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 36,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
