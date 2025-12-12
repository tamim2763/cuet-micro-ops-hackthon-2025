import { create } from 'zustand';
import type { DownloadJob } from '@/types';

interface DownloadJobState {
  jobs: DownloadJob[];
  loading: boolean;
  error: string | null;
  addJob: (job: DownloadJob) => void;
  updateJob: (id: string, updates: Partial<DownloadJob>) => void;
  removeJob: (id: string) => void;
  setJobs: (jobs: DownloadJob[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDownloadJobStore = create<DownloadJobState>((set) => ({
  jobs: [],
  loading: false,
  error: null,
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)),
    })),
  removeJob: (id) => set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),
  setJobs: (jobs) => set({ jobs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ jobs: [], loading: false, error: null }),
}));
