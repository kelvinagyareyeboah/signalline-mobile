import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface UserState {
  user: UserProfile;
  phoneNumber: string | null;
  isAuthenticated: boolean;
  themePreference: 'light' | 'dark' | 'system';
  isHydrated: boolean;

  setPhoneNumber: (phone: string) => void;
  verifyOtp: (code: string) => Promise<boolean>;
  completeProfileSetup: (name: string, handle: string, avatarUrl?: string) => Promise<void>;
  updateProfile: (partial: Partial<UserProfile>) => Promise<void>;
  setThemePreference: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  logout: () => Promise<void>;
  loadInitialState: () => Promise<void>;
}

const AUTH_KEY = '@signalline_is_authenticated';
const USER_KEY = '@signalline_user_profile';
const PHONE_KEY = '@signalline_phone_number';
const THEME_KEY = '@signalline_theme_preference';

const DEFAULT_USER: UserProfile = {
  id: 'user_self',
  name: 'Alex Rivera',
  handle: '@alex.rivera',
  status: 'online',
  sharingLocation: false,
};

export const useUserStore = create<UserState>((set, get) => ({
  user: DEFAULT_USER,
  phoneNumber: null,
  isAuthenticated: false,
  themePreference: 'dark',
  isHydrated: false,

  setPhoneNumber: (phone: string) => {
    set({ phoneNumber: phone });
    AsyncStorage.setItem(PHONE_KEY, phone).catch(console.error);
  },

  verifyOtp: async (code: string) => {
    // Accepts any valid 6-digit code for clean, instant verification
    if (code.length === 6) {
      return true;
    }
    return false;
  },

  completeProfileSetup: async (name: string, handle: string, avatarUrl?: string) => {
    const updatedUser: UserProfile = {
      ...get().user,
      name: name.trim() || 'User',
      handle: handle.startsWith('@') ? handle.trim() : `@${handle.trim().toLowerCase()}`,
      avatarUrl,
    };

    set({
      user: updatedUser,
      isAuthenticated: true,
    });

    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(true));
    } catch (e) {
      console.error('Failed to persist user profile:', e);
    }
  },

  updateProfile: async (partial) => {
    const updated = { ...get().user, ...partial };
    set({ user: updated });
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  },

  setThemePreference: async (theme: 'light' | 'dark' | 'system') => {
    set({ themePreference: theme });
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  },

  logout: async () => {
    set({
      isAuthenticated: false,
      phoneNumber: null,
      user: DEFAULT_USER,
    });
    try {
      await AsyncStorage.multiRemove([AUTH_KEY, PHONE_KEY, USER_KEY]);
    } catch (e) {
      console.error('Failed to clear auth state on logout:', e);
    }
  },

  loadInitialState: async () => {
    try {
      const authVal = await AsyncStorage.getItem(AUTH_KEY);
      const userVal = await AsyncStorage.getItem(USER_KEY);
      const phoneVal = await AsyncStorage.getItem(PHONE_KEY);
      const themeVal = await AsyncStorage.getItem(THEME_KEY);

      set({
        isAuthenticated: authVal ? JSON.parse(authVal) : false,
        user: userVal ? JSON.parse(userVal) : DEFAULT_USER,
        phoneNumber: phoneVal || null,
        themePreference: (themeVal as 'light' | 'dark' | 'system') || 'dark',
        isHydrated: true,
      });
    } catch (e) {
      console.error('Failed to load user state from AsyncStorage:', e);
      set({ isHydrated: true });
    }
  },
}));
