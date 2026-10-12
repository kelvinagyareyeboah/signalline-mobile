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
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/stores/useUserStore';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const COUNTRIES = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪' },
];

export default function PhoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const setPhoneNumber = useUserStore((state) => state.setPhoneNumber);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);

  const handleNext = () => {
    const rawDigits = phoneNumberInput.replace(/\D/g, '');
    if (rawDigits.length < 6) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }

    const fullPhone = `${selectedCountry.code} ${phoneNumberInput.trim()}`;
    setPhoneNumber(fullPhone);

    Alert.alert(
      'Verify number',
      `We will verify the phone number:\n\n${fullPhone}\n\nIs this OK, or would you like to edit the number?`,
      [
        { text: 'Edit', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => router.push('/auth/otp'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'space-between' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header Content */}
        <View style={styles.topArea}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Enter your phone number
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            SignalLine will need to verify your phone number. Carrier SMS charges may apply.
          </Text>

          {/* Country Selector Row */}
          <Pressable
            style={[styles.countryRow, { borderBottomColor: colors.accent }]}
            onPress={() => setShowCountryModal(true)}>
            <Text style={[styles.countryText, { color: colors.text }]}>
              {selectedCountry.flag} {selectedCountry.name}
            </Text>
            <FontAwesome name="caret-down" size={14} color={colors.accent} />
          </Pressable>

          {/* Number Input Row */}
          <View style={styles.inputRow}>
            <View style={[styles.codeBox, { borderBottomColor: colors.accent }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>
                {selectedCountry.code}
              </Text>
            </View>

            <TextInput
              style={[
                styles.phoneInput,
                {
                  color: colors.text,
                  borderBottomColor: colors.accent,
                },
              ]}
              placeholder="Phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumberInput}
              onChangeText={setPhoneNumberInput}
              autoFocus
            />
          </View>
        </View>

        {/* Bottom Next Button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              {
                backgroundColor: phoneNumberInput.trim().length >= 6 ? colors.accent : colors.surfaceSubtle,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleNext}
            disabled={phoneNumberInput.trim().length < 6}>
            <Text
              style={[
                styles.nextButtonText,
                {
                  color: phoneNumberInput.trim().length >= 6 ? '#FFFFFF' : colors.textMuted,
                },
              ]}>
              Next
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Country Selection Modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <SafeAreaView style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowCountryModal(false)} hitSlop={10}>
              <FontAwesome name="arrow-left" size={18} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose a country</Text>
          </View>

          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.countryItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryModal(false);
                }}>
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={[styles.countryItemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.countryItemCode, { color: colors.textSecondary }]}>{item.code}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 16,
  },
  countryRow: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    marginTop: 28,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputRow: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  codeBox: {
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    minWidth: 54,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    letterSpacing: 0.5,
  },
  bottomArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nextButton: {
    width: 140,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
  },
  modalHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryFlag: {
    fontSize: 22,
    marginRight: 16,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  countryItemCode: {
    fontSize: 15,
    fontWeight: '500',
  },
});
