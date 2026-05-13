import { create } from "zustand";

const MAX_RAW_POINTS = 10000;

export const usePnlHistoryStore = create((set) => ({
  rawHistory: [],
  selectedWindowMinutes: 5,
  addHistoryPoint: (point) =>
    set((state) => ({
      rawHistory: [...state.rawHistory, point].slice(-MAX_RAW_POINTS),
    })),
  setSelectedWindowMinutes: (minutes) =>
    set({
      selectedWindowMinutes: minutes,
    }),
  clearHistory: () =>
    set({
      rawHistory: [],
    }),
}));
