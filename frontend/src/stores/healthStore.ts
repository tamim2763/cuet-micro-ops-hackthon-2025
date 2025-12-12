import { create } from "zustand";
import type { HealthResponse } from "@/types";

interface HealthState {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  setHealth: (health: HealthResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  health: null,
  loading: true,
  error: null,
  setHealth: (health) => set({ health }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ health: null, loading: true, error: null }),
}));
