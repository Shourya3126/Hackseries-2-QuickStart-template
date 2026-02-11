import { create } from "zustand";

export type UserRole = "student" | "teacher" | "admin";

interface AppState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userName: string;
  walletConnected: boolean;
  setAuthenticated: (auth: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  setWalletConnected: (connected: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  userRole: null,
  userName: "",
  walletConnected: false,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setUserRole: (role) => set({ userRole: role }),
  setUserName: (name) => set({ userName: name }),
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  logout: () =>
    set({
      isAuthenticated: false,
      userRole: null,
      userName: "",
      walletConnected: false,
    }),
}));
