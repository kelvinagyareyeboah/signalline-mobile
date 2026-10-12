import { create } from 'zustand';
import { LocationShareState, LocationDuration, LocationAccuracySetting, Contact } from '../types';
import { myLocationKalmanFilter } from '../services/kalmanFilter';
import { socketService } from '../services/socketService';

interface LocationState {
  shareState: LocationShareState;
  sharingContacts: Contact[];

  toggleLocationSharing: (duration?: LocationDuration) => void;
  setAccuracySetting: (accuracy: LocationAccuracySetting) => void;
  setDurationSetting: (duration: LocationDuration) => void;
  updateMyLocation: (coords: { latitude: number; longitude: number; accuracy?: number; heading?: number; speed?: number }) => void;
  updateContactLocation: (contactId: string, latitude: number, longitude: number) => void;
  stopContactSharing: (contactId: string) => void;
  stopSharing: () => void;
}

const MOCK_SHARING_CONTACTS: Contact[] = [
  {
    id: 'contact_sarah',
    name: 'Sarah Chen',
    handle: '@sarah.c',
    status: 'online',
    sharingLocation: true,
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      heading: 45,
      speed: 1.2,
      timestamp: Date.now() - 1000 * 30,
    },
  },
  {
    id: 'contact_marcus',
    name: 'Marcus Vance',
    handle: '@marcus.v',
    status: 'online',
    sharingLocation: true,
    location: {
      latitude: 37.7833,
      longitude: -122.4167,
      heading: 180,
      speed: 0.8,
      timestamp: Date.now() - 1000 * 120,
    },
  },
  {
    id: 'contact_elena',
    name: 'Elena Rostova',
    handle: '@elena.r',
    status: 'away',
    sharingLocation: true,
    location: {
      latitude: 37.769,
      longitude: -122.446,
      heading: 270,
      speed: 0.0,
      timestamp: Date.now() - 1000 * 300,
    },
  },
];

export const useLocationStore = create<LocationState>((set, get) => ({
  shareState: {
    isSharing: true,
    durationMinutes: 60,
    expiresAt: Date.now() + 1000 * 60 * 60,
    accuracy: 'balanced',
    myLocation: {
      latitude: 37.7752,
      longitude: -122.418,
      accuracy: 12,
      timestamp: Date.now(),
    },
  },
  sharingContacts: MOCK_SHARING_CONTACTS,

  toggleLocationSharing: (duration) => {
    const current = get().shareState;
    if (current.isSharing && !duration) {
      get().stopSharing();
      return;
    }

    const dur = duration ?? current.durationMinutes;
    const expiresAt = dur === 0 ? null : Date.now() + dur * 60 * 1000;

    set({
      shareState: {
        ...current,
        isSharing: true,
        durationMinutes: dur,
        expiresAt,
      },
    });

    if (current.myLocation) {
      socketService.broadcastLocation(current.myLocation);
    }
  },

  setAccuracySetting: (accuracy) => {
    set((state) => ({
      shareState: {
        ...state.shareState,
        accuracy,
      },
    }));
  },

  setDurationSetting: (duration) => {
    const expiresAt = duration === 0 ? null : Date.now() + duration * 60 * 1000;
    set((state) => ({
      shareState: {
        ...state.shareState,
        durationMinutes: duration,
        expiresAt,
      },
    }));
  },

  updateMyLocation: (coords) => {
    // 1. Pass raw coordinates through Kalman Filter to smooth GPS noise
    const smoothed = myLocationKalmanFilter.update({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy || 10,
      timestamp: Date.now(),
    });

    const smoothedCoords = {
      latitude: smoothed.latitude,
      longitude: smoothed.longitude,
      accuracy: smoothed.accuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: Date.now(),
    };

    set((state) => ({
      shareState: {
        ...state.shareState,
        myLocation: smoothedCoords,
      },
    }));

    // 2. Broadcast live coordinates if currently sharing
    if (get().shareState.isSharing) {
      socketService.broadcastLocation(smoothedCoords);
    }
  },

  updateContactLocation: (contactId, latitude, longitude) => {
    set((state) => {
      const exists = state.sharingContacts.some((c) => c.id === contactId);
      if (exists) {
        return {
          sharingContacts: state.sharingContacts.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  sharingLocation: true,
                  location: {
                    latitude,
                    longitude,
                    timestamp: Date.now(),
                  },
                }
              : c
          ),
        };
      } else {
        // New sharing contact discovered via broadcast
        const newContact: Contact = {
          id: contactId,
          name: contactId.replace('contact_', '').replace('user_', ''),
          handle: `@${contactId.replace('contact_', '')}`,
          status: 'online',
          sharingLocation: true,
          location: {
            latitude,
            longitude,
            timestamp: Date.now(),
          },
        };
        return {
          sharingContacts: [...state.sharingContacts, newContact],
        };
      }
    });
  },

  stopContactSharing: (contactId) => {
    set((state) => ({
      sharingContacts: state.sharingContacts.filter((c) => c.id !== contactId),
    }));
  },

  stopSharing: () => {
    set((state) => ({
      shareState: {
        ...state.shareState,
        isSharing: false,
        expiresAt: null,
      },
    }));
    socketService.broadcastStopLocation();
  },
}));
