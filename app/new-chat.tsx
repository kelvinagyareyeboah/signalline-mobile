import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useChatStore } from '../src/stores/useChatStore';
import { Avatar } from '../src/components/Avatar';
import Colors from '../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Contact } from '../src/types';

export default function NewChatModal() {
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

  const handleSelectContact = (contact: Contact) => {
    let conv = conversations.find((c) => c.contactId === contact.id);
    const convId = conv ? conv.id : `conv_${contact.id.replace('contact_', '')}`;
    setActiveConversation(convId);
    router.replace({ pathname: '/chat/[id]', params: { id: convId } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* WhatsApp Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={17} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextWrapper}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New chat</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {contacts.length} contacts
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSubtle }]}>
        <FontAwesome name="search" size={14} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search name or handle..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.contactRow,
              { backgroundColor: pressed ? colors.surfaceSubtle : colors.background },
            ]}
            onPress={() => handleSelectContact(item)}>
            <Avatar
              name={item.name}
              size={48}
              status={item.status}
              sharingLocation={item.sharingLocation}
            />
            <View style={[styles.contactInfo, { borderBottomColor: colors.border }]}>
              <Text style={[styles.nameText, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.handleText, { color: colors.textSecondary }]}>
                {item.handle} • {item.status === 'online' ? 'online' : `last seen ${item.lastSeen || 'recently'}`}
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
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
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
  contactInfo: {
    flex: 1,
    marginLeft: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  handleText: {
    fontSize: 13,
    marginTop: 2,
  },
});
