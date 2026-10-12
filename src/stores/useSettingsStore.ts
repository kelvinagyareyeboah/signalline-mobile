import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSettings, LocationDuration, LocationAccuracySetting } from '../types';

interface SettingsState {
  notifications: NotificationSettings;
  defaultLocationDuration: LocationDuration;
  defaultLocationAccuracy: LocationAccuracySetting;
  serverUrl: string;
  isHydrated: boolean;

  setNotificationCategory: (category: keyof Omit<NotificationSettings, 'systemPermissionGranted'>, value: boolean) => Promise<void>;
  setSystemPermissionGranted: (granted: boolean) => void;
  setDefaultLocationDuration: (duration: LocationDuration) => Promise<void>;
  setDefaultLocationAccuracy: (accuracy: LocationAccuracySetting) => Promise<void>;
  setServerUrl: (url: string) => Promise<void>;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = '@signalline_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notifications: {
    newMessages: true,
    locationRequests: true,
    presenceUpdates: true,
    systemPermissionGranted: true,
  },
  defaultLocationDuration: 60, // 1 hour
  defaultLocationAccuracy: 'balanced',
  serverUrl: 'https://signalline-mobile.onrender.com',
  isHydrated: false,

  setNotificationCategory: async (category, value) => {
    const updatedNotifications = {
      ...get().notifications,
      [category]: value,
    };
    set({ notifications: updatedNotifications });
    await get().saveSettings();
  },

  setSystemPermissionGranted: (granted) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        systemPermissionGranted: granted,
      },
    }));
  },

  setDefaultLocationDuration: async (duration) => {
    set({ defaultLocationDuration: duration });
    await get().saveSettings();
  },

  setDefaultLocationAccuracy: async (accuracy) => {
    set({ defaultLocationAccuracy: accuracy });
    await get().saveSettings();
  },

  setServerUrl: async (url) => {
    set({ serverUrl: url });
    await get().saveSettings();
  },

  saveSettings: async () => {
    const state = get();
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          notifications: state.notifications,
          defaultLocationDuration: state.defaultLocationDuration,
          defaultLocationAccuracy: state.defaultLocationAccuracy,
          serverUrl: state.serverUrl,
        })
      );
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          notifications: parsed.notifications ?? get().notifications,
          defaultLocationDuration: parsed.defaultLocationDuration ?? 60,
          defaultLocationAccuracy: parsed.defaultLocationAccuracy ?? 'balanced',
          serverUrl: parsed.serverUrl ?? 'wss://socket.signalline.app',
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
      set({ isHydrated: true });
    }
  },
}));
