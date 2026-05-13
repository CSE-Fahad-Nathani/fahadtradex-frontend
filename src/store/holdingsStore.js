import { create } from "zustand";

export const useHoldingsStore = create((set) => ({
  portfolio: [],
  positions: [],
  isLoaded: false,
  setPortfolio: (portfolio) => set({ portfolio, isLoaded: true }),
  setPositions: (positions) => set({ positions, isLoaded: true }),
  setHoldings: ({ portfolio = [], positions = [] }) =>
    set({
      portfolio,
      positions,
      isLoaded: true,
    }),
  clearHoldings: () =>
    set({
      portfolio: [],
      positions: [],
      isLoaded: false,
    }),
}));
