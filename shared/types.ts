export type ProposalStatus =
  | 'voting'
  | 'public_notice'
  | 'appealing'
  | 'approved'
  | 'construction'
  | 'completed'
  | 'rejected';

export type VoteOption = 'agree' | 'disagree' | 'abstain';

export type ProgressNodeStatus = 'pending' | 'in_progress' | 'completed';

export interface Household {
  id: string;
  proposalId: string;
  building: string;
  unit: string;
  floor: number;
  roomNumber: string;
  area: number;
  floorCoefficient: number;
}

export interface Proposal {
  id: string;
  communityName: string;
  buildingNumber: string;
  totalFloors: number;
  unitsCount: number;
  householdsPerUnit: number;
  totalHouseholds: number;
  estimatedTotalCost: number;
  elevatorPlan: string;
  estimatedDuration: number;
  initiator: string;
  status: ProposalStatus;
  votingStartDate: string;
  votingEndDate: string;
  createdAt: string;
}

export interface FeeEstimateItem {
  householdId: string;
  floor: number;
  roomNumber: string;
  area: number;
  floorCoefficient: number;
  weightFactor: number;
  estimatedFee: number;
  percentage: number;
}

export interface VoteRecord {
  id: string;
  proposalId: string;
  householdId: string;
  option: VoteOption;
  weight: number;
  votedAt: string;
}

export interface VoteResult {
  totalHouseholds: number;
  votedCount: number;
  votingRate: number;
  agreeCount: number;
  disagreeCount: number;
  abstainCount: number;
  weightedAgree: number;
  weightedDisagree: number;
  weightedAbstain: number;
  weightedAgreeRate: number;
  passed: boolean;
}

export interface Appeal {
  id: string;
  proposalId: string;
  householdId: string;
  reason: string;
  evidenceUrls?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  createdAt: string;
  reply?: string;
}

export interface ProgressNode {
  id: string;
  proposalId: string;
  stepIndex: number;
  title: string;
  description: string;
  status: ProgressNodeStatus;
  startDate?: string;
  endDate?: string;
  responsible?: string;
  attachments?: { name: string; url: string }[];
}

export interface FinanceRecord {
  id: string;
  proposalId: string;
  category: 'design' | 'construction' | 'equipment' | 'inspection' | 'other';
  categoryName: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
  expenseDate: string;
  voucherUrl?: string;
}

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  voting: '投票中',
  public_notice: '公示中',
  appealing: '申诉处理中',
  approved: '已通过',
  construction: '施工中',
  completed: '已完工',
  rejected: '未通过',
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  voting: 'bg-accent-100 text-accent-700 border-accent-200',
  public_notice: 'bg-primary-100 text-primary-700 border-primary-200',
  appealing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  construction: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-success-100 text-success-700 border-success-600',
  rejected: 'bg-danger-100 text-danger-700 border-danger-200',
};

export const VOTE_LABELS: Record<VoteOption, string> = {
  agree: '同意',
  disagree: '反对',
  abstain: '弃权',
};

export const FINANCE_CATEGORIES: Array<{ key: FinanceRecord['category']; label: string }> = [
  { key: 'design', label: '勘测设计费' },
  { key: 'construction', label: '土建施工费' },
  { key: 'equipment', label: '电梯设备费' },
  { key: 'inspection', label: '验收检测费' },
  { key: 'other', label: '其他费用' },
];
