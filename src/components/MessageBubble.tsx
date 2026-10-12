import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ChatMessage } from '../types';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const isSelf = message.senderId === 'user_self';

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusTicks = () => {
    if (!isSelf) return null;

    if (message.status === 'queued') {
      return <FontAwesome name="clock-o" size={10} color="#8696A0" style={styles.tickIcon} />;
    }
    if (message.status === 'sent') {
      return <FontAwesome name="check" size={11} color="rgba(233, 237, 239, 0.6)" style={styles.tickIcon} />;
    }
    if (message.status === 'delivered') {
      return (
        <View style={styles.doubleTickContainer}>
          <FontAwesome name="check" size={11} color="rgba(233, 237, 239, 0.6)" style={{ marginRight: -4 }} />
          <FontAwesome name="check" size={11} color="rgba(233, 237, 239, 0.6)" />
        </View>
      );
    }
    if (message.status === 'read') {
      return (
        <View style={styles.doubleTickContainer}>
          <FontAwesome name="check" size={11} color={colors.blueTick || '#53BDEB'} style={{ marginRight: -4 }} />
          <FontAwesome name="check" size={11} color={colors.blueTick || '#53BDEB'} />
        </View>
      );
    }
    return null;
  };

  return (
    <View
      style={[
        styles.container,
        isSelf ? styles.alignRight : styles.alignLeft,
      ]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isSelf ? colors.bubbleSelf : colors.bubbleOther,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: isSelf ? 10 : 2,
            borderBottomRightRadius: isSelf ? 2 : 10,
          },
        ]}>
        {/* WhatsApp-Style Live Location Card */}
        {message.locationAttachment && (
          <Pressable
            style={[
              styles.locationCard,
              { backgroundColor: isSelf ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)' },
            ]}
            onPress={() => router.push('/(tabs)/live')}>
            <View style={styles.locationIconBadge}>
              <FontAwesome name="map-marker" size={18} color="#25D366" />
            </View>
            <View style={styles.locationTextWrapper}>
              <Text style={styles.locationTitle}>
                {message.locationAttachment.label || 'Live Location'}
              </Text>
              <Text style={styles.locationSubtitle}>
                {message.locationAttachment.latitude.toFixed(4)},{' '}
                {message.locationAttachment.longitude.toFixed(4)}
              </Text>
              <Text style={styles.locationActionText}>Tap to view on map</Text>
            </View>
          </Pressable>
        )}

        {/* Message Text */}
        <Text
          style={[
            styles.messageText,
            {
              color: isSelf ? colors.bubbleSelfText : colors.bubbleOtherText,
            },
          ]}>
          {message.text}
        </Text>

        {/* Footer Time & Read Status Ticks */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.timeText,
              {
                color: isSelf ? 'rgba(233, 237, 239, 0.65)' : colors.textSecondary,
              },
            ]}>
            {formatTime(message.timestamp)}
          </Text>
          {renderStatusTicks()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 10,
    flexDirection: 'row',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 11,
    paddingTop: 7,
    paddingBottom: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: 0.15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
    gap: 3,
    alignSelf: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
  },
  tickIcon: {
    marginLeft: 3,
  },
  doubleTickContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 3,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: 8,
    marginBottom: 6,
    gap: 10,
  },
  locationIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E9EDEF',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#8696A0',
    marginTop: 1,
  },
  locationActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A884',
    marginTop: 3,
  },
});
