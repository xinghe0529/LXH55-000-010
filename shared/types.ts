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
  reviewedAt?: string;
  reviewer?: string;
}

export type AppealStatus = Appeal['status'];

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  pending: '待处理',
  reviewed: '已受理',
  resolved: '已解决',
  rejected: '已驳回',
};

export const APPEAL_STATUS_COLORS: Record<AppealStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  reviewed: 'bg-primary-100 text-primary-700 border-primary-200',
  resolved: 'bg-success-100 text-success-700 border-success-200',
  rejected: 'bg-danger-100 text-danger-700 border-danger-200',
};

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

export interface ConstructionDailyPhoto {
  url: string;
  description?: string;
}

export interface ConstructionDailyReport {
  id: string;
  proposalId: string;
  progressNodeId?: string;
  reportDate: string;
  weather?: string;
  temperature?: string;
  constructionContent: string;
  constructionProgress: string;
  workerCount?: number;
  materials?: string;
  issues?: string;
  nextPlan?: string;
  photos: ConstructionDailyPhoto[];
  reporter: string;
  createdAt: string;
  updatedAt: string;
}

export const WEATHER_OPTIONS = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '中雪', '大雪', '雾', '霾'];

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PaymentRecord {
  id: string;
  proposalId: string;
  householdId: string;
  requiredAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  paidAt?: string;
  remark?: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: '未缴费',
  partial: '部分缴费',
  paid: '已缴清',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-danger-100 text-danger-700 border-danger-200',
  partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-success-100 text-success-700 border-success-200',
};

export type NotificationType = 'vote_result' | 'progress_node' | 'payment_reminder' | 'appeal_reply' | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientType: 'all' | 'household';
  recipientIds: string[];
  proposalId: string;
  title: string;
  content: string;
  relatedId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
  readBy: string[];
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  vote_result: '投票结果',
  progress_node: '施工进度',
  payment_reminder: '资金催缴',
  appeal_reply: '申诉回复',
  system: '系统通知',
};

export const NOTIFICATION_PRIORITY_COLORS: Record<NotificationPriority, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};
