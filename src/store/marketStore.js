import { create } from "zustand";

export const useMarketStore = create((set) => ({
  data: {},

  // update single tick
  setTick: (tick) =>
    set((state) => ({
      data: {
        ...state.data,
        [String(tick.Token)]: tick,
      },
    })),
  
  clearMarket: () =>
    set({
      data: {},
    }),
}));