import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Contact } from '../types';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface MapViewComponentProps {
  myLocation: {
    latitude: number;
    longitude: number;
  } | null;
  sharingContacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
}

export const MapViewComponent: React.FC<MapViewComponentProps> = ({
  myLocation,
  sharingContacts,
  onSelectContact,
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.fallbackMapContainer, { backgroundColor: colors.surfaceSubtle }]}>
      <View style={styles.gridOverlay}>
        <FontAwesome name="map-o" size={64} color={colors.border} style={styles.bgIcon} />
      </View>

      <Text style={[styles.mapTitleHeader, { color: colors.text }]}>
        SignalLine Live Radar & Geospatial Coordinates
      </Text>

      {/* Rendered Live Contact Cards on Map Grid */}
      <View style={styles.pinsGrid}>
        {/* Self card */}
        {myLocation && (
          <View style={[styles.pinCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <View style={[styles.selfPinInner, { backgroundColor: colors.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pinCardName, { color: colors.text }]}>You (Self • Broadcasting)</Text>
              <Text style={[styles.pinCardCoords, { color: colors.textSecondary }]}>
                {myLocation.latitude.toFixed(4)}, {myLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}

        {/* Contacts cards */}
        {sharingContacts.map((contact) => {
          if (!contact.location) return null;
          return (
            <Pressable
              key={contact.id}
              onPress={() => onSelectContact && onSelectContact(contact)}
              style={({ pressed }) => [
                styles.pinCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}>
              <View style={[styles.contactMarkerIcon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome name="map-marker" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pinCardName, { color: colors.text }]}>{contact.name}</Text>
                  <View style={[styles.livePulseDot, { backgroundColor: colors.online }]} />
                </View>
                <Text style={[styles.pinCardCoords, { color: colors.textSecondary }]}>
                  {contact.location.latitude.toFixed(4)}, {contact.location.longitude.toFixed(4)}
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={12} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackMapContainer: {
    width: '100%',
    height: '100%',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  bgIcon: {
    transform: [{ scale: 2 }],
  },
  mapTitleHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  pinsGrid: {
    width: '100%',
    maxWidth: 420,
    gap: 10,
    zIndex: 2,
  },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selfPinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  contactMarkerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCardName: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinCardCoords: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
