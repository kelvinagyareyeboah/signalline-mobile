import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../src/stores/useChatStore';
import { Avatar } from '../../src/components/Avatar';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Contact } from '../../src/types';

export default function ContactsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const contacts = useChatStore((state) => state.contacts);
  const conversations = useChatStore((state) => state.conversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChat = (contact: Contact) => {
    let conv = conversations.find((c) => c.contactId === contact.id);
    const convId = conv ? conv.id : `conv_${contact.id.replace('contact_', '')}`;
    setActiveConversation(convId);
    router.push({ pathname: '/chat/[id]', params: { id: convId } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* WhatsApp Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSubtle }]}>
        <FontAwesome name="search" size={14} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search contacts"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              { backgroundColor: pressed ? colors.surfaceSubtle : colors.background },
            ]}
            onPress={() => handleOpenChat(item)}>
            <Avatar
              name={item.name}
              size={50}
              status={item.status}
              sharingLocation={item.sharingLocation}
            />

            <View style={[styles.contactDetails, { borderBottomColor: colors.border }]}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: colors.text }]}>{item.name}</Text>
                {item.sharingLocation && (
                  <View style={[styles.liveBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.liveBadgeText, { color: colors.accent }]}>LIVE MAP</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                {item.status === 'online' ? 'online' : item.lastSeen ? `last seen ${item.lastSeen}` : item.handle}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contactDetails: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  nameText: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
