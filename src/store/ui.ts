import { create } from 'zustand';
import type { ProposalStatus } from '../../shared/types';
import type { ProposalWithResult } from '../lib/apiClient';

interface UIState {
  currentHouseholdId: string | null;
  setCurrentHouseholdId: (id: string | null) => void;
  toast: { id: number; type: 'success' | 'error' | 'info'; message: string } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  newProposalModal: boolean;
  setNewProposalModal: (v: boolean) => void;
  filterStatus: ProposalStatus | 'all';
  setFilterStatus: (s: ProposalStatus | 'all') => void;
  keyword: string;
  setKeyword: (k: string) => void;
  proposals: ProposalWithResult[];
  setProposals: (p: ProposalWithResult[]) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  selectedProposalIds: string[];
  toggleSelectedProposal: (id: string) => void;
  clearSelectedProposals: () => void;
  setSelectedProposals: (ids: string[]) => void;
}

let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  currentHouseholdId: null,
  setCurrentHouseholdId: (id) => set({ currentHouseholdId: id }),
  toast: null,
  showToast: (message, type = 'info') => {
    if (_toastTimer) clearTimeout(_toastTimer);
    set({ toast: { id: Date.now(), type, message } });
    _toastTimer = setTimeout(() => get().clearToast(), 3000);
  },
  clearToast: () => set({ toast: null }),
  newProposalModal: false,
  setNewProposalModal: (v) => set({ newProposalModal: v }),
  filterStatus: 'all',
  setFilterStatus: (s) => set({ filterStatus: s }),
  keyword: '',
  setKeyword: (k) => set({ keyword: k }),
  proposals: [],
  setProposals: (p) => set({ proposals: p }),
  loading: false,
  setLoading: (v) => set({ loading: v }),
  selectedProposalIds: [],
  toggleSelectedProposal: (id) =>
    set((state) => {
      const exists = state.selectedProposalIds.includes(id);
      if (exists) {
        return { selectedProposalIds: state.selectedProposalIds.filter((x) => x !== id) };
      }
      if (state.selectedProposalIds.length >= 4) {
        state.showToast('最多只能选择 4 个提案进行对比', 'error');
        return {};
      }
      return { selectedProposalIds: [...state.selectedProposalIds, id] };
    }),
  clearSelectedProposals: () => set({ selectedProposalIds: [] }),
  setSelectedProposals: (ids) => set({ selectedProposalIds: ids }),
}));
