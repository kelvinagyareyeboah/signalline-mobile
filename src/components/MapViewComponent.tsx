import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Contact } from '../types';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
} catch (e) {
  console.log('Native react-native-maps module fallback enabled');
}

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

  const defaultRegion = {
    latitude: myLocation?.latitude || 5.6037,
    longitude: myLocation?.longitude || -0.1870,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  // If react-native-maps is available on native platform
  if (MapView && Marker && Platform.OS !== 'web') {
    return (
      <MapView
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={false}
        customMapStyle={DARK_MAP_STYLE}>
        {/* User Self Marker */}
        {myLocation && (
          <Marker
            coordinate={{
              latitude: myLocation.latitude,
              longitude: myLocation.longitude,
            }}
            title="You (Live)">
            <View style={styles.selfPinOuter}>
              <View style={[styles.selfPinInner, { backgroundColor: colors.accent }]} />
            </View>
          </Marker>
        )}

        {/* Contacts Sharing Location */}
        {sharingContacts.map((contact) => {
          if (!contact.location) return null;
          return (
            <Marker
              key={contact.id}
              coordinate={{
                latitude: contact.location.latitude,
                longitude: contact.location.longitude,
              }}
              onPress={() => onSelectContact && onSelectContact(contact)}>
              <View style={styles.contactPinWrapper}>
                <View style={styles.contactPinBubble}>
                  <Text style={styles.contactPinText}>{contact.name.split(' ')[0]}</Text>
                  <View style={styles.livePulseDot} />
                </View>
                <FontAwesome name="map-marker" size={32} color="#00F2FE" />
              </View>

              {Callout && (
                <Callout style={styles.calloutContainer}>
                  <Text style={styles.calloutName}>{contact.name}</Text>
                  <Text style={styles.calloutHandle}>{contact.handle}</Text>
                  <Text style={styles.calloutTime}>Live • Updating now</Text>
                </Callout>
              )}
            </Marker>
          );
        })}
      </MapView>
    );
  }

  // Cross-Platform Styled Fallback Canvas for Web / Fallback
  return (
    <View style={[styles.fallbackMapContainer, { backgroundColor: colors.surfaceSubtle }]}>
      <View style={styles.gridOverlay}>
        <FontAwesome name="map" size={72} color={colors.border} style={styles.bgIcon} />
      </View>

      <Text style={[styles.mapTitleHeader, { color: colors.text }]}>
        Signalline Radar & Live Coordinates Feed
      </Text>

      {/* Rendered Live Contact Cards on Map Grid */}
      <View style={styles.pinsGrid}>
        {/* Self card */}
        {myLocation && (
          <View style={[styles.pinCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <View style={[styles.selfPinInner, { backgroundColor: colors.accent }]} />
            <View>
              <Text style={[styles.pinCardName, { color: colors.text }]}>You (Self)</Text>
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
              style={[
                styles.pinCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.contactMarkerIcon}>
                <FontAwesome name="map-marker" size={18} color="#00F2FE" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.pinCardName, { color: colors.text }]}>{contact.name}</Text>
                  <View style={styles.livePulseDot} />
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

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#131822' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#4b687a' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f293d' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2c394b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0b0e14' }],
  },
];

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  selfPinOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00F2FE',
  },
  selfPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contactPinWrapper: {
    alignItems: 'center',
  },
  contactPinBubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -4,
    borderWidth: 1,
    borderColor: '#00F2FE',
  },
  contactPinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  calloutContainer: {
    width: 140,
    padding: 6,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  calloutHandle: {
    fontSize: 11,
    color: '#64748B',
  },
  calloutTime: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  fallbackMapContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    opacity: 0.08,
  },
  bgIcon: {},
  mapTitleHeader: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  pinsGrid: {
    gap: 10,
  },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  contactMarkerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCardName: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinCardCoords: {
    fontSize: 12,
    marginTop: 2,
  },
});
