import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useChatStore } from '../stores/useChatStore';

export const SocketBanner: React.FC = () => {
  const socketState = useChatStore((state) => state.socketState);

  // When connected, show nothing: clean and clutter-free like WhatsApp
  if (socketState === 'connected') {
    return null;
  }

  const isReconnecting = socketState === 'reconnecting';

  return (
    <View style={styles.bannerContainer}>
      <FontAwesome
        name={isReconnecting ? 'refresh' : 'exclamation-circle'}
        size={12}
        color="#E9EDEF"
      />
      <Text style={styles.bannerText}>
        {isReconnecting ? 'Connecting...' : 'Waiting for network...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#182229',
    paddingVertical: 5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222D34',
  },
  bannerText: {
    color: '#8696A0',
    fontSize: 12,
    fontWeight: '600',
  },
});
