import type {
  Proposal,
  Household,
  FeeEstimateItem,
  VoteRecord,
  VoteResult,
  Appeal,
  ProgressNode,
  FinanceRecord,
  VoteOption,
  ProgressNodeStatus,
  ConstructionDailyReport,
} from '../../shared/types';

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

async function handle<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiResponse<T>;
  if ('success' in json && json.success === false) throw new Error(json.error);
  const ok = json as { success: true; data: T };
  return ok.data;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
  return handle<T>(res);
}
async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}
async function put<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}
async function del<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  return handle<T>(res);
}

export interface ProposalWithResult extends Proposal {
  voteResult: VoteResult | null;
}

export interface Stats {
  total: number;
  voting: number;
  construction: number;
  completed: number;
  households: number;
  totalCost: number;
}

export const api = {
  getStats: () => get<Stats>('/api/proposals/stats'),
  getProposals: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return get<ProposalWithResult[]>(`/api/proposals${qs ? '?' + qs : ''}`);
  },
  getProposal: (id: string) => get<Proposal>(`/api/proposals/${id}`),
  createProposal: (data: Partial<Proposal>) => post<Proposal>('/api/proposals', data),
  getHouseholds: (id: string) => get<Household[]>(`/api/proposals/${id}/households`),
  getFeeEstimate: (id: string) =>
    get<{ proposalId: string; estimatedTotalCost: number; totalWeightFactor: number; items: FeeEstimateItem[] }>(
      `/api/proposals/${id}/fee-estimate`
    ),
  submitVote: (proposalId: string, householdId: string, option: VoteOption) =>
    post<VoteRecord>('/api/votes', { proposalId, householdId, option }),
  getVoteResult: (id: string) => get<VoteResult>(`/api/proposals/${id}/vote-result`),
  getMyVote: (id: string, householdId: string) =>
    get<VoteRecord | null>(`/api/proposals/${id}/my-vote?householdId=${encodeURIComponent(householdId)}`),
  submitAppeal: (data: { proposalId: string; householdId: string; reason: string }) =>
    post<Appeal>('/api/appeals', data),
  getAppeals: (id: string) => get<Appeal[]>(`/api/proposals/${id}/appeals`),
  getProgress: (id: string) => get<ProgressNode[]>(`/api/proposals/${id}/progress`),
  updateProgressNode: (proposalId: string, nodeId: string, patch: Partial<{ status: ProgressNodeStatus; startDate: string; endDate: string }>) =>
    put<ProgressNode>(`/api/proposals/${proposalId}/progress/${nodeId}`, patch),
  getFinances: (id: string) =>
    get<{ records: FinanceRecord[]; summary: { budget: number; actual: number } }>(`/api/proposals/${id}/finances`),
  addFinance: (data: Omit<FinanceRecord, 'id'>) => post<FinanceRecord>('/api/finances', data),
  getFloorCoefficient: (floor: number) =>
    get<{ floor: number; coefficient: number }>(`/api/calc/floor-coefficient?floor=${floor}`),
  getDailyReports: (proposalId: string, params?: { progressNodeId?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.progressNodeId) q.set('progressNodeId', params.progressNodeId);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    const qs = q.toString();
    return get<ConstructionDailyReport[]>(`/api/proposals/${proposalId}/daily-reports${qs ? '?' + qs : ''}`);
  },
  getDailyReport: (proposalId: string, reportId: string) =>
    get<ConstructionDailyReport>(`/api/proposals/${proposalId}/daily-reports/${reportId}`),
  addDailyReport: (proposalId: string, data: Omit<ConstructionDailyReport, 'id' | 'proposalId' | 'createdAt' | 'updatedAt'>) =>
    post<ConstructionDailyReport>(`/api/proposals/${proposalId}/daily-reports`, data),
  updateDailyReport: (proposalId: string, reportId: string, data: Partial<Omit<ConstructionDailyReport, 'id' | 'proposalId' | 'createdAt'>>) =>
    put<ConstructionDailyReport>(`/api/proposals/${proposalId}/daily-reports/${reportId}`, data),
  deleteDailyReport: (proposalId: string, reportId: string) =>
    del<{ message: string }>(`/api/proposals/${proposalId}/daily-reports/${reportId}`),
};

export default api;
