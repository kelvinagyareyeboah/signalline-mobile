import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '../../src/stores/useChatStore';
import { useLocationStore } from '../../src/stores/useLocationStore';
import { MessageBubble } from '../../src/components/MessageBubble';
import { SocketBanner } from '../../src/components/SocketBanner';
import { Avatar } from '../../src/components/Avatar';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const conversationId = id || 'conv_sarah';

  const conversations = useChatStore((state) => state.conversations);
  const contacts = useChatStore((state) => state.contacts);
  const messages = useChatStore((state) => state.messages[conversationId] || []);
  const typingMap = useChatStore((state) => state.typingMap);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const myLocation = useLocationStore((state) => state.shareState.myLocation);

  const [inputText, setInputText] = useState('');

  const conv = conversations.find((c) => c.id === conversationId);
  const contact = contacts.find((c) => c.id === (conv?.contactId || 'contact_sarah')) || contacts[0];
  const isTyping = typingMap[conversationId] || false;

  useEffect(() => {
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [conversationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(conversationId, inputText.trim());
    setInputText('');
  };

  const handleShareLocationPin = () => {
    const lat = myLocation?.latitude || 37.7752;
    const lng = myLocation?.longitude || -122.418;

    sendMessage(
      conversationId,
      '📍 Live Location shared',
      {
        latitude: lat,
        longitude: lng,
        label: 'Current Position',
      }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* WhatsApp Clean Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={17} color={colors.text} />
        </Pressable>

        <Pressable
          style={styles.headerProfileWrapper}
          onPress={() => router.push('/(tabs)/live')}>
          <Avatar
            name={contact.name}
            size={38}
            status={contact.status}
            sharingLocation={contact.sharingLocation}
          />
          <View style={styles.headerTextWrapper}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
              {contact.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: isTyping ? colors.accent : colors.textSecondary }]}>
              {isTyping ? 'typing...' : contact.status === 'online' ? 'online' : `last seen ${contact.lastSeen || 'recently'}`}
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.headerActionBtn, pressed && { opacity: 0.6 }]}
          onPress={handleShareLocationPin}
          hitSlop={8}>
          <FontAwesome name="map-marker" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <SocketBanner />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {/* Messages Feed */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} />}
        />

        {/* WhatsApp-Style Clean Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBg }]}>
            <Pressable
              style={styles.attachBtn}
              onPress={handleShareLocationPin}
              hitSlop={8}>
              <FontAwesome name="paperclip" size={19} color={colors.textSecondary} />
            </Pressable>

            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Message"
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              multiline
            />
          </View>

          <Pressable
            style={[
              styles.sendBtn,
              {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={handleSend}>
            <FontAwesome
              name={inputText.trim() ? 'send' : 'microphone'}
              size={16}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  headerProfileWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingVertical: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 12,
    minHeight: 44,
    maxHeight: 100,
  },
  attachBtn: {
    paddingRight: 8,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5,
    paddingVertical: 8,
    maxHeight: 90,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
