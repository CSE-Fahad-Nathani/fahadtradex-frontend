import { create } from "zustand";

export const useHoldingsStore = create((set, get) => ({
  portfolio: [],
  positions: [],
  portfolioLoaded: false,
  positionsLoaded: false,
  portfolioLoading: false,
  positionsLoading: false,

  isLoaded: false,

  setPortfolioLoading: (portfolioLoading) => set({ portfolioLoading }),
  setPositionsLoading: (positionsLoading) => set({ positionsLoading }),

  setPortfolio: (portfolio) =>
    set({
      portfolio,
      portfolioLoaded: true,
      portfolioLoading: false,
      isLoaded: get().positionsLoaded,
    }),

  setPositions: (positions) =>
    set({
      positions,
      positionsLoaded: true,
      positionsLoading: false,
      isLoaded: get().portfolioLoaded,
    }),

  setHoldings: ({ portfolio = [], positions = [] }) =>
    set({
      portfolio,
      positions,
      portfolioLoaded: true,
      positionsLoaded: true,
      portfolioLoading: false,
      positionsLoading: false,
      isLoaded: true,
    }),

  clearHoldings: () =>
    set({
      portfolio: [],
      positions: [],
      portfolioLoaded: false,
      positionsLoaded: false,
      portfolioLoading: false,
      positionsLoading: false,
      isLoaded: false,
    }),
}));
