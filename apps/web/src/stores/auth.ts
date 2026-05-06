import { create } from "zustand";

type User = { id: string; email: string; name: string; role: string };

export const useAuthStore = create<{
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user?: User) => void;
  logout: () => void;
}>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set((state) => ({ accessToken, user: user ?? state.user })),
  logout: () => set({ accessToken: null, user: null })
}));
