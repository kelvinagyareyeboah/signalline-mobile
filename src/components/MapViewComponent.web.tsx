import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
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
  const isDark = colorScheme === 'dark';

  const iframeRef = useRef<any>(null);
  const [activeTarget, setActiveTarget] = useState<string>('all');

  // Listen for messages from within the Leaflet map iframe
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (data && data.type === 'SELECT_CONTACT') {
          const contact = sharingContacts.find((c) => c.id === data.contactId);
          if (contact && onSelectContact) {
            onSelectContact(contact);
          }
        }
      } catch (e) {
        // Ignore cross-origin non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sharingContacts, onSelectContact]);

  const flyToLocation = (targetId: string, lat?: number, lng?: number, zoom: number = 15) => {
    setActiveTarget(targetId);
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    if (targetId === 'all') {
      iframeRef.current.contentWindow.postMessage({ type: 'FIT_ALL' }, '*');
    } else if (lat !== undefined && lng !== undefined) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'FLY_TO', lat, lng, zoom },
        '*'
      );
    }
  };

  // Generate self coordinates or fallback to Accra Central
  const selfCoords = myLocation || { latitude: 5.6037, longitude: -0.1870 };

  // Generate self-contained HTML for Leaflet OpenStreetMap
  const mapHtml = useMemo(() => {
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const contactsData = sharingContacts
      .filter((c) => c.location)
      .map((c) => ({
        id: c.id,
        name: c.name,
        handle: c.handle,
        lat: c.location!.latitude,
        lng: c.location!.longitude,
        shortName: c.name.split(' ')[0],
      }));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: ${isDark ? '#0B141B' : '#F0F2F5'}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
    
    .pulse-pin {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .pin-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .pin-badge.self {
      background: #00F2FE;
      color: #000000;
    }
    .pin-badge.contact {
      background: #00A884;
      color: #FFFFFF;
    }
    .beacon-ring {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .beacon-ring.self { border: 2px solid #00F2FE; }
    .beacon-ring.contact { border: 2px solid #00A884; }
    
    .dot-center {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 2px;
      box-shadow: 0 0 8px rgba(0,0,0,0.4);
      border: 2px solid #FFFFFF;
    }
    .dot-center.self { background: #00F2FE; }
    .dot-center.contact { background: #00A884; }

    @keyframes pulse-ring {
      0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.9; }
      80%, 100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
    }

    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#111B21' : '#FFFFFF'};
      color: ${isDark ? '#E9EDEF' : '#111B21'};
      border-radius: 12px;
      padding: 6px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      border: 1px solid ${isDark ? '#222E35' : '#E9EDEF'};
    }
    .leaflet-popup-tip {
      background: ${isDark ? '#111B21' : '#FFFFFF'};
    }
    .popup-card {
      font-size: 12px;
      line-height: 1.4;
      min-width: 150px;
    }
    .popup-title {
      font-size: 13.5px;
      font-weight: 700;
      color: ${isDark ? '#FFFFFF' : '#111B21'};
      margin-bottom: 2px;
    }
    .popup-sub {
      font-size: 11px;
      color: ${isDark ? '#8696A0' : '#667781'};
      margin-bottom: 8px;
    }
    .popup-btn {
      display: block;
      width: 100%;
      padding: 6px 10px;
      border-radius: 8px;
      background: #00A884;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      border: none;
      cursor: pointer;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }
    .leaflet-control-zoom a {
      background: ${isDark ? '#111B21' : '#FFFFFF'} !important;
      color: ${isDark ? '#E9EDEF' : '#111B21'} !important;
      border-color: ${isDark ? '#222E35' : '#E9EDEF'} !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: true,
      attributionControl: false
    }).setView([5.5900, -0.1750], 13);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var markersGroup = L.featureGroup().addTo(map);

    // Self Marker
    var selfLat = ${selfCoords.latitude};
    var selfLng = ${selfCoords.longitude};
    var selfIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-pin"><div class="beacon-ring self"></div><div class="pin-badge self">★ You (Live)</div><div class="dot-center self"></div></div>',
      iconSize: [90, 42],
      iconAnchor: [45, 21]
    });
    var selfMarker = L.marker([selfLat, selfLng], { icon: selfIcon }).addTo(markersGroup);
    selfMarker.bindPopup('<div class="popup-card"><div class="popup-title">You (Broadcasting)</div><div class="popup-sub">Accra Central • Live GPS</div></div>');

    // Contacts
    var contacts = ${JSON.stringify(contactsData)};
    contacts.forEach(function(c) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="pulse-pin"><div class="beacon-ring contact"></div><div class="pin-badge contact">🟢 ' + c.shortName + '</div><div class="dot-center contact"></div></div>',
        iconSize: [80, 42],
        iconAnchor: [40, 21]
      });
      var marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(markersGroup);
      marker.bindPopup(
        '<div class="popup-card">' +
        '<div class="popup-title">' + c.name + '</div>' +
        '<div class="popup-sub">' + c.handle + '<br/>GPS: ' + c.lat.toFixed(4) + ', ' + c.lng.toFixed(4) + '</div>' +
        '<button class="popup-btn" onclick="window.parent.postMessage({ type: \\'SELECT_CONTACT\\', contactId: \\'' + c.id + '\\' }, \\'*\\')">Message Contact</button>' +
        '</div>'
      );
    });

    try {
      map.fitBounds(markersGroup.getBounds().pad(0.18));
    } catch(e) {}

    window.addEventListener('message', function(event) {
      var data = event.data;
      if (!data) return;
      if (data.type === 'FLY_TO') {
        map.flyTo([data.lat, data.lng], data.zoom || 15, { duration: 1.0 });
      } else if (data.type === 'FIT_ALL') {
        try {
          map.fitBounds(markersGroup.getBounds().pad(0.18));
        } catch(e) {}
      }
    });
  </script>
</body>
</html>`;
  }, [isDark, selfCoords.latitude, selfCoords.longitude, sharingContacts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Interactive Leaflet Web Map Iframe */}
      <View style={styles.mapWrapper}>
        {Platform.OS === 'web' && (
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              borderRadius: 0,
            }}
            title="SignalLine Accra Live Map"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </View>

      {/* Floating Top Controls Header: Ghana Accra Radar & Contact Selectors */}
      <View style={styles.topPillOverlay}>
        <View style={[styles.radarIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.blinkingDot, { backgroundColor: colors.online }]} />
          <Text style={[styles.radarText, { color: colors.text }]}>Accra Radar</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}>
          {/* Fit all button */}
          <Pressable
            style={[
              styles.filterPill,
              {
                backgroundColor: activeTarget === 'all' ? colors.accent : colors.surface,
                borderColor: activeTarget === 'all' ? colors.accent : colors.border,
              },
            ]}
            onPress={() => flyToLocation('all')}>
            <FontAwesome
              name="globe"
              size={11}
              color={activeTarget === 'all' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterPillText,
                { color: activeTarget === 'all' ? '#FFFFFF' : colors.text },
              ]}>
              All Accra
            </Text>
          </Pressable>

          {/* Self button */}
          {myLocation && (
            <Pressable
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeTarget === 'self' ? colors.tint : colors.surface,
                  borderColor: activeTarget === 'self' ? colors.tint : colors.border,
                },
              ]}
              onPress={() => flyToLocation('self', myLocation.latitude, myLocation.longitude, 16)}>
              <FontAwesome
                name="crosshairs"
                size={11}
                color={activeTarget === 'self' ? '#000000' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterPillText,
                  { color: activeTarget === 'self' ? '#000000' : colors.text },
                ]}>
                You (Live)
              </Text>
            </Pressable>
          )}

          {/* Contacts buttons */}
          {sharingContacts
            .filter((c) => c.location)
            .map((contact) => {
              const isSelected = activeTarget === contact.id;
              return (
                <Pressable
                  key={contact.id}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    flyToLocation(
                      contact.id,
                      contact.location!.latitude,
                      contact.location!.longitude,
                      16
                    );
                    if (onSelectContact) onSelectContact(contact);
                  }}>
                  <View style={[styles.miniDot, { backgroundColor: colors.online }]} />
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}>
                    {contact.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  topPillOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  radarIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  blinkingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  radarText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pillsScroll: {
    gap: 6,
    alignItems: 'center',
    paddingRight: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
