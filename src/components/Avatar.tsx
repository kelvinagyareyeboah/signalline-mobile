import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnlineStatus } from '../types';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface AvatarProps {
  name: string;
  size?: number;
  status?: OnlineStatus;
  sharingLocation?: boolean;
  showPresence?: boolean;
}

const AVATAR_PALETTE = [
  '#0EA5E9',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
];

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 48,
  status = 'offline',
  sharingLocation = false,
  showPresence = true,
}) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = (n: string) => {
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[index];
  };

  const statusColor =
    status === 'online'
      ? colors.online
      : status === 'away'
      ? colors.away
      : colors.offline;

  const dotSize = Math.max(12, Math.floor(size * 0.28));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getBackgroundColor(name),
          },
          sharingLocation && {
            borderWidth: 2,
            borderColor: colors.accent,
          },
        ]}>
        <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
          {getInitials(name)}
        </Text>
      </View>

      {showPresence && (
        <View
          style={[
            styles.presenceDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: statusColor,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2.5,
  },
});
