import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/stores/useUserStore';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const user = useUserStore((state) => state.user);
  const completeProfileSetup = useUserStore((state) => state.completeProfileSetup);

  const [name, setName] = useState(user.name || '');
  const [handle, setHandle] = useState(user.handle ? user.handle.replace('@', '') : 'alex.rivera');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setIsSubmitting(true);
    await completeProfileSetup(name.trim(), handle.trim());
    setIsSubmitting(false);

    // Navigate straight to the main WhatsApp-style chats tab
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'space-between' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topArea}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile info</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Please provide your name and an optional profile photo
          </Text>

          {/* Avatar Camera Placeholder */}
          <Pressable
            style={[styles.avatarCircle, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => Alert.alert('Photo', 'Camera and gallery photo picker.')}>
            <FontAwesome name="camera" size={32} color={colors.textSecondary} />
            <View style={[styles.addPhotoBadge, { backgroundColor: colors.accent }]}>
              <FontAwesome name="plus" size={12} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    color: colors.text,
                    borderBottomColor: colors.accent,
                  },
                ]}
                placeholder="Type your name here"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
              <FontAwesome name="smile-o" size={20} color={colors.textSecondary} />
            </View>

            <View style={[styles.inputWrapper, { marginTop: 16 }]}>
              <Text style={[styles.handlePrefix, { color: colors.textSecondary }]}>@</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    color: colors.text,
                    borderBottomColor: colors.border,
                  },
                ]}
                placeholder="username"
                placeholderTextColor={colors.textMuted}
                value={handle}
                onChangeText={(val) => setHandle(val.toLowerCase().replace(/\s/g, ''))}
                autoCapitalize="none"
                maxLength={20}
              />
            </View>
          </View>
        </View>

        {/* Next Button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: name.trim() ? colors.accent : colors.surfaceSubtle,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleFinish}
            disabled={!name.trim() || isSubmitting}>
            <Text
              style={[
                styles.nextBtnText,
                { color: name.trim() ? '#FFFFFF' : colors.textMuted },
              ]}>
              {isSubmitting ? 'Setting up...' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  avatarCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    position: 'relative',
  },
  addPhotoBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B141A',
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handlePrefix: {
    fontSize: 18,
    fontWeight: '700',
  },
  nameInput: {
    flex: 1,
    fontSize: 16.5,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
  },
  bottomArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nextBtn: {
    width: 140,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
