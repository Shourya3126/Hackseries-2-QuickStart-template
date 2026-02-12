import { create } from "zustand";

export type UserRole = "student" | "teacher" | "admin";

interface AppState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userName: string;
  walletConnected: boolean;
  walletAddress: string | null;
  setAuthenticated: (auth: boolean) => void;
  setUserRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  userRole: null,
  userName: "",
  walletConnected: false,
  walletAddress: null,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setUserRole: (role) => set({ userRole: role }),
  setUserName: (name) => set({ userName: name }),
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setWalletAddress: (address) =>
    set({ walletAddress: address, walletConnected: !!address }),
  logout: () =>
    set({
      isAuthenticated: false,
      userRole: null,
      userName: "",
      walletConnected: false,
      walletAddress: null,
    }),
}));
