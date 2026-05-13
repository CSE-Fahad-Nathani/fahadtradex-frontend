import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  loading: false,

  // ✅ set full user
  setUser: (user) => set({ user }),

  // ✅ update balance only (useful later)
  updateBalance: (balance) =>
    set((state) => ({
      user: {
        ...state.user,
        balance,
      },
    })),

  // setLoading: (loading) => set({ loading }),
  setLoading: (loading) => set({ loading }),

  clearUser: () =>
    set({
      user: null,
      loading: false,
    }),
}));