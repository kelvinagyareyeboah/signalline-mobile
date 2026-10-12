import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import Colors from '../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function PermissionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const notifications = useSettingsStore((state) => state.notifications);
  const setNotificationCategory = useSettingsStore((state) => state.setNotificationCategory);
  const setSystemPermissionGranted = useSettingsStore((state) => state.setSystemPermissionGranted);

  const requestSystemPermissions = async () => {
    try {
      const locStatus = await Location.requestForegroundPermissionsAsync();
      const notifStatus = await Notifications.requestPermissionsAsync();

      if (notifStatus.granted) {
        setSystemPermissionGranted(true);
      }
    } catch (e) {
      console.log('System permission request:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Permissions & Alerts</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: colors.primaryLight, borderColor: colors.accent }]}>
          <FontAwesome name="bell" size={28} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>
              Real-Time Notifications
            </Text>
            <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
              Customize exactly which events deliver push notifications to your device.
            </Text>
          </View>
        </View>

        {/* System Permission Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <FontAwesome name="shield" size={16} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>System Permission Status</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>OS Authorization:</Text>
            <Text
              style={[
                styles.statusValue,
                {
                  color: notifications.systemPermissionGranted ? colors.online : colors.danger,
                },
              ]}>
              {notifications.systemPermissionGranted ? 'Granted' : 'Action Required'}
            </Text>
          </View>

          <Pressable
            style={[styles.grantBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={requestSystemPermissions}>
            <FontAwesome name="key" size={14} color={colors.accent} />
            <Text style={[styles.grantBtnText, { color: colors.accent }]}>
              Check / Prompt OS Permission Dialog
            </Text>
          </Pressable>
        </View>

        {/* Category Preferences Toggles */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
          NOTIFICATION CATEGORIES
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Category 1: New Messages */}
          <View style={styles.toggleRow}>
            <View style={styles.iconCircle}>
              <FontAwesome name="commenting" size={16} color="#00F2FE" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>New Messages</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Alert when contacts send real-time chat messages
              </Text>
            </View>
            <Switch
              value={notifications.newMessages}
              onValueChange={(val) => setNotificationCategory('newMessages', val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          {/* Category 2: Location-Share Requests */}
          <View style={[styles.toggleRow, styles.borderTop]}>
            <View style={styles.iconCircle}>
              <FontAwesome name="map-marker" size={16} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                Location Share Requests
              </Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Alert when contacts request your live location stream
              </Text>
            </View>
            <Switch
              value={notifications.locationRequests}
              onValueChange={(val) => setNotificationCategory('locationRequests', val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          {/* Category 3: Presence Changes */}
          <View style={[styles.toggleRow, styles.borderTop]}>
            <View style={styles.iconCircle}>
              <FontAwesome name="user-circle" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Presence Changes</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                Alert when favorite contacts come online or go live
              </Text>
            </View>
            <Switch
              value={notifications.presenceUpdates}
              onValueChange={(val) => setNotificationCategory('presenceUpdates', val)}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  bannerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerDesc: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  grantBtn: {
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  grantBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
