import { create } from "zustand";

interface NetworkState {
    pendingRequests: number;
    showSlowLoader: boolean;
    beginRequest: () => void;
    endRequest: () => void;
    setShowSlowLoader: (visible: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
    pendingRequests: 0,
    showSlowLoader: false,

    beginRequest: () =>
        set((state) => ({
            pendingRequests: state.pendingRequests + 1,
        })),

    endRequest: () =>
        set((state) => ({
            pendingRequests: Math.max(0, state.pendingRequests - 1),
        })),

    setShowSlowLoader: (visible) =>
        set({ showSlowLoader: visible }),
}));
