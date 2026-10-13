import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useLocationStore } from '../../src/stores/useLocationStore';
import { MapViewComponent } from '../../src/components/MapViewComponent';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { LocationDuration, LocationAccuracySetting, Contact } from '../../src/types';

export default function LiveScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const shareState = useLocationStore((state) => state.shareState);
  const sharingContacts = useLocationStore((state) => state.sharingContacts);
  const toggleLocationSharing = useLocationStore((state) => state.toggleLocationSharing);
  const setAccuracySetting = useLocationStore((state) => state.setAccuracySetting);
  const setDurationSetting = useLocationStore((state) => state.setDurationSetting);
  const stopSharing = useLocationStore((state) => state.stopSharing);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const getRemainingTimeText = () => {
    if (!shareState.isSharing) return 'Not sharing location';
    if (shareState.durationMinutes === 0 || !shareState.expiresAt) return 'Sharing until turned off';
    const remainingMs = shareState.expiresAt - Date.now();
    if (remainingMs <= 0) return 'Expired';
    const mins = Math.ceil(remainingMs / (1000 * 60));
    return `Sharing live (${mins}m remaining)`;
  };

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          myLocation={shareState.isSharing ? shareState.myLocation : null}
          sharingContacts={sharingContacts}
          onSelectContact={handleSelectContact}
        />

        {/* Selected Contact Overlay Card */}
        {selectedContact && (
          <View style={[styles.overlayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.overlayHeader}>
              <View style={styles.overlayNameRow}>
                <View style={[styles.activeDot, { backgroundColor: colors.online }]} />
                <Text style={[styles.overlayName, { color: colors.text }]}>{selectedContact.name}</Text>
              </View>
              <Pressable onPress={() => setSelectedContact(null)} hitSlop={8}>
                <FontAwesome name="times" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.overlayHandle, { color: colors.textSecondary }]}>
              {selectedContact.handle} • Sharing live coordinates
            </Text>

            <View style={styles.overlayActions}>
              <Pressable
                style={[styles.overlayActionBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  const convId =
                    selectedContact.id === 'contact_sarah'
                      ? 'conv_sarah'
                      : selectedContact.id === 'contact_marcus'
                      ? 'conv_marcus'
                      : selectedContact.id === 'contact_elena'
                      ? 'conv_elena'
                      : 'conv_kofi';
                  router.push({ pathname: '/chat/[id]', params: { id: convId } });
                }}>
                <FontAwesome name="comment" size={13} color="#FFFFFF" />
                <Text style={styles.overlayActionText}>Message</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Controls Sheet */}
      <ScrollView contentContainerStyle={styles.controlsSheet} showsVerticalScrollIndicator={false}>
        {/* Toggle Share Row */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.shareToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Share live location</Text>
              <Text style={[styles.cardSub, { color: shareState.isSharing ? colors.online : colors.textSecondary }]}>
                {getRemainingTimeText()}
              </Text>
            </View>

            <Switch
              value={shareState.isSharing}
              onValueChange={() => toggleLocationSharing()}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>

          {shareState.isSharing && (
            <Pressable style={[styles.stopBtn, { backgroundColor: colors.surfaceSubtle }]} onPress={stopSharing}>
              <FontAwesome name="stop-circle" size={14} color={colors.danger} />
              <Text style={[styles.stopBtnText, { color: colors.danger }]}>Stop sharing</Text>
            </Pressable>
          )}
        </View>

        {/* Duration Selector */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>SHARING DURATION</Text>
          <View style={styles.durationRow}>
            {([15, 60, 0] as LocationDuration[]).map((dur) => {
              const isSelected = shareState.durationMinutes === dur;
              const label = dur === 15 ? '15 minutes' : dur === 60 ? '1 hour' : 'Until turned off';
              return (
                <Pressable
                  key={dur}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setDurationSetting(dur)}>
                  <Text
                    style={[
                      styles.durationChipText,
                      { color: isSelected ? colors.accent : colors.textSecondary, fontWeight: isSelected ? '700' : '500' },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* GPS Accuracy Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>GPS ACCURACY MODE</Text>
          <View style={styles.accuracyGrid}>
            <Pressable
              style={[
                styles.accuracyCard,
                {
                  backgroundColor:
                    shareState.accuracy === 'balanced' ? colors.primaryLight : colors.surfaceSubtle,
                  borderColor:
                    shareState.accuracy === 'balanced' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setAccuracySetting('balanced')}>
              <Text
                style={[
                  styles.accuracyTitle,
                  { color: shareState.accuracy === 'balanced' ? colors.accent : colors.text },
                ]}>
                Balanced
              </Text>
              <Text style={[styles.accuracyDesc, { color: colors.textSecondary }]}>
                ~50m precision. Preserves battery for all-day sharing.
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.accuracyCard,
                {
                  backgroundColor:
                    shareState.accuracy === 'high' ? colors.primaryLight : colors.surfaceSubtle,
                  borderColor:
                    shareState.accuracy === 'high' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setAccuracySetting('high')}>
              <Text
                style={[
                  styles.accuracyTitle,
                  { color: shareState.accuracy === 'high' ? colors.accent : colors.text },
                ]}>
                High Precision
              </Text>
              <Text style={[styles.accuracyDesc, { color: colors.textSecondary }]}>
                Sub-10m Kalman-filtered GPS. Best for live tracking.
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 350,
    maxHeight: '48%',
    minHeight: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayCard: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  overlayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlayName: {
    fontSize: 16,
    fontWeight: '700',
  },
  overlayHandle: {
    fontSize: 13,
    marginBottom: 10,
  },
  overlayActions: {
    flexDirection: 'row',
    gap: 8,
  },
  overlayActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  overlayActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsSheet: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  shareToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  stopBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipText: {
    fontSize: 12.5,
  },
  accuracyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  accuracyCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  accuracyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  accuracyDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
