/**
 * Per-device display & accessibility preferences. Kept apart from the demo data so
 * "Reset demo" never undoes someone's theme or text size.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const DEFAULT_PREFS = {
  theme: 'system', // 'system' | 'light' | 'dark'
  colorVision: 'default', // 'default' | 'safe' (colour-blind friendly palette + patterns)
  textSize: 'normal', // 'normal' | 'large' | 'larger'
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
};

export const usePrefsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      setPref: (key, value) => set({ [key]: value }),
      resetPrefs: () => set(DEFAULT_PREFS),
    }),
    {
      name: 'studyplus-display-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme, colorVision, textSize, highContrast, reduceMotion, readableFont }) => ({
        theme,
        colorVision,
        textSize,
        highContrast,
        reduceMotion,
        readableFont,
      }),
    },
  ),
);
