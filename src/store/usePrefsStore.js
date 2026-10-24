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
  // Layout sizes the user can drag or zoom.
  alertsWidth: 320, // px, desktop alert panel
  hourPx: 60, // calendar row height per hour
  treeZoom: 'fit', // 'fit' or a scale factor
  columnWidths: {}, // { [tableId]: { [columnId]: px } }
};

export const usePrefsStore = create(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      setPref: (key, value) => set({ [key]: value }),
      setColumnWidth: (table, column, width) =>
        set((s) => ({ columnWidths: { ...s.columnWidths, [table]: { ...s.columnWidths[table], [column]: width } } })),
      resetColumnWidths: (table) =>
        set((s) => {
          const next = { ...s.columnWidths };
          delete next[table];
          return { columnWidths: next };
        }),
      // "Reset to defaults" in the Display panel resets display options, not the user's layout sizes.
      resetPrefs: () =>
        set(({ alertsWidth, hourPx, treeZoom, columnWidths }) => ({ ...DEFAULT_PREFS, alertsWidth, hourPx, treeZoom, columnWidths })),
    }),
    {
      name: 'studyplus-display-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme, colorVision, textSize, highContrast, reduceMotion, readableFont, alertsWidth, hourPx, treeZoom, columnWidths }) => ({
        theme,
        colorVision,
        textSize,
        highContrast,
        reduceMotion,
        readableFont,
        alertsWidth,
        hourPx,
        treeZoom,
        columnWidths,
      }),
    },
  ),
);
