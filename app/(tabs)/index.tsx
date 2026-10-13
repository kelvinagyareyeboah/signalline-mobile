import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../src/stores/useChatStore';
import { Avatar } from '../../src/components/Avatar';
import { SocketBanner } from '../../src/components/SocketBanner';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Conversation, Contact } from '../../src/types';

export default function ChatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const conversations = useChatStore((state) => state.conversations);
  const contacts = useChatStore((state) => state.contacts);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const formatRelativeTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getContactForConv = (conv: Conversation): Contact => {
    return (
      contacts.find((c) => c.id === conv.contactId) || {
        id: conv.contactId,
        name: 'Unknown Contact',
        handle: '@unknown',
        status: 'offline',
        sharingLocation: false,
      }
    );
  };

  const handleOpenChat = (conv: Conversation) => {
    setActiveConversation(conv.id);
    router.push({ pathname: '/chat/[id]', params: { id: conv.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Network banner only when offline */}
      <SocketBanner />

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const contact = getContactForConv(item);
          const hasUnread = item.unreadCount > 0;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.convRow,
                { backgroundColor: pressed ? colors.surfaceSubtle : colors.background },
              ]}
              onPress={() => handleOpenChat(item)}>
              <Avatar
                name={contact.name}
                size={52}
                status={contact.status}
                sharingLocation={contact.sharingLocation}
              />

              <View style={[styles.convDetails, { borderBottomColor: colors.border }]}>
                <View style={styles.topRow}>
                  <Text style={[styles.nameText, { color: colors.text }]}>{contact.name}</Text>
                  <Text
                    style={[
                      styles.timeText,
                      { color: hasUnread ? colors.accent : colors.textSecondary },
                    ]}>
                    {formatRelativeTime(item.lastMessageTime)}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.previewText,
                      {
                        color: hasUnread ? colors.text : colors.textSecondary,
                        fontWeight: hasUnread ? '700' : '400',
                      },
                    ]}>
                    {item.lastMessageText}
                  </Text>

                  {hasUnread && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome name="comments-o" size={44} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No chats yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Tap the green button below to start a conversation.
            </Text>
          </View>
        }
      />

      {/* WhatsApp-Style Circular Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.accent },
          pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        ]}
        onPress={() => router.push('/new-chat')}>
        <FontAwesome name="comment" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  convDetails: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameText: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  previewText: {
    fontSize: 14.5,
    flex: 1,
    lineHeight: 19,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
