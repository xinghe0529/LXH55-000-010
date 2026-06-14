import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  User,
  FileText,
  Paperclip,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Building2,
  Users,
  Coins,
  Hammer,
  Activity,
  Layers,
  Receipt,
  ArrowRight,
  Plus,
  Cloud,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import { cn } from '../lib/utils';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  FINANCE_CATEGORIES,
  type Proposal,
  type ProgressNode,
  type FinanceRecord,
  type VoteResult,
  type ConstructionDailyReport,
} from '../../shared/types';
import { formatCurrency } from '../../shared/calculator';

const PROGRESS_STATUS_LABELS: Record<ProgressNode['status'], string> = {
  completed: '已完成',
  in_progress: '进行中',
  pending: '待开始',
};

const PROGRESS_STATUS_COLORS: Record<ProgressNode['status'], string> = {
  completed: 'bg-success-100 text-success-700 border-success-200',
  in_progress: 'bg-primary-100 text-primary-700 border-primary-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
};

const DOCUMENT_EXAMPLES = [
  { name: '施工方案.pdf', type: 'pdf' },
  { name: '规划许可证.png', type: 'image' },
  { name: '特检报告.pdf', type: 'pdf' },
  { name: '竣工验收单.pdf', type: 'pdf' },
  { name: '质量保证书.pdf', type: 'pdf' },
  { name: '电梯合格证.png', type: 'image' },
];

type TabKey = 'all' | FinanceRecord['category'];

const TAB_OPTIONS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: '全部' },
  ...FINANCE_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
];

function StatusBadge({ status }: { status: Proposal['status'] }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProgressBadge({ status }: { status: ProgressNode['status'] }) {
  return (
    <span className={cn('badge', PROGRESS_STATUS_COLORS[status])}>
      {PROGRESS_STATUS_LABELS[status]}
    </span>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary-700" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 leading-tight">{label}</div>
        <div className="text-sm font-bold text-slate-800 truncate mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function TimelineNode({ node, reportCount }: { node: ProgressNode; reportCount?: number }) {
  const isInProgress = node.status === 'in_progress';
  const isCompleted = node.status === 'completed';

  return (
    <div className="relative pl-16 pb-8 last:pb-0">
      <div className="absolute left-0 top-1 bottom-0 w-1.5 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-400 via-primary-500 to-primary-700 opacity-20" />
        {isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-b from-success-400 via-success-500 to-success-600" />
        )}
        {isInProgress && (
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-primary-400 to-primary-600" />
        )}
      </div>

      <div className="absolute left-0 top-1 -translate-x-[calc(50%-0.3rem)] w-8 h-8 flex items-center justify-center z-10">
        {isCompleted ? (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-success-500 to-success-600 shadow-lg shadow-success-500/30 flex items-center justify-center ring-4 ring-white">
            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        ) : isInProgress ? (
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary-500/40 animate-ping" />
            <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/40 flex items-center justify-center ring-4 ring-white">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center ring-4 ring-white">
            <Circle className="w-3.5 h-3.5 text-slate-400" />
          </div>
        )}
      </div>

      <div
        className={cn(
          'rounded-2xl p-5 border transition-all duration-300',
          isInProgress
            ? 'bg-white border-primary-300 shadow-lg shadow-primary-500/10 ring-2 ring-primary-200/50'
            : 'bg-slate-50/50 border-slate-200/60 hover:bg-white hover:shadow-card hover:border-slate-200'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 text-xs font-bold">
              {node.stepIndex + 1}
            </span>
            <h4 className="font-display font-bold text-lg text-slate-800">{node.title}</h4>
          </div>
          <ProgressBadge status={node.status} />
        </div>

        {node.responsible && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <User className="w-4 h-4 text-slate-400" />
            <span>负责人：</span>
            <span className="font-medium text-slate-700">{node.responsible}</span>
          </div>
        )}

        {(node.startDate || node.endDate) && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {node.startDate || '—'} ~ {node.endDate || '—'}
            </span>
          </div>
        )}

        <p className="text-sm text-slate-600 leading-relaxed">{node.description}</p>

        {node.attachments && node.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
            {node.attachments.map((att, idx) => (
              <button
                key={idx}
                onClick={() => useUIStore.getState().showToast('文档预览功能开发中', 'info')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 font-medium transition-colors"
              >
                <Paperclip className="w-3 h-3" />
                {att.name}
              </button>
            ))}
          </div>
        )}

        {reportCount != null && reportCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium border border-primary-100">
              <FileText className="w-3 h-3" />
              {reportCount} 条施工日报
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceSummaryCard({
  summary,
}: {
  summary: { budget: number; actual: number };
}) {
  const remaining = summary.budget - summary.actual;
  const progress = summary.budget > 0 ? Math.min(100, (summary.actual / summary.budget) * 100) : 0;
  const overBudget = remaining < 0;

  return (
    <div className="card p-6 grain-overlay relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-accent-400/10 to-primary-500/10" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800">资金使用汇总</h3>
            <p className="text-xs text-slate-500">预算 vs 实际支出对比</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-xs font-medium text-slate-500">预算总额</div>
            <div className="text-xl font-display font-black text-slate-800 mt-1">
              {formatCurrency(summary.budget)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">已支出</div>
            <div className="text-xl font-display font-black text-primary-700 mt-1">
              {formatCurrency(summary.actual)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">剩余</div>
            <div
              className={cn(
                'text-xl font-display font-black mt-1',
                overBudget ? 'text-danger-600' : 'text-success-700'
              )}
            >
              {formatCurrency(Math.abs(remaining))}
              {overBudget && <span className="text-xs ml-1">超支</span>}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">支出进度</span>
            <span className="font-bold text-primary-700">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-accent-500 transition-all duration-700 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
            <span>0</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProgressBoardPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useUIStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [progress, setProgress] = useState<ProgressNode[]>([]);
  const [finances, setFinances] = useState<{
    records: FinanceRecord[];
    summary: { budget: number; actual: number };
  } | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [dailyReports, setDailyReports] = useState<ConstructionDailyReport[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const [p, prog, fin, vr, reports] = await Promise.all([
          api.getProposal(id),
          api.getProgress(id),
          api.getFinances(id),
          api.getVoteResult(id).catch(() => null),
          api.getDailyReports(id).catch(() => []),
        ]);
        if (!alive) return;
        setProposal(p);
        setProgress(prog);
        setFinances(fin);
        setVoteResult(vr);
        setDailyReports(reports);
      } catch (e) {
        showToast((e as Error).message, 'error');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, showToast]);

  const sortedProgress = useMemo(
    () => [...progress].sort((a, b) => a.stepIndex - b.stepIndex),
    [progress]
  );

  const completedCount = useMemo(
    () => sortedProgress.filter((n) => n.status === 'completed').length,
    [sortedProgress]
  );

  const completionRate = useMemo(() => {
    if (sortedProgress.length === 0) return 0;
    return (completedCount / sortedProgress.length) * 100;
  }, [completedCount, sortedProgress.length]);

  const filteredRecords = useMemo(() => {
    if (!finances) return [];
    if (activeTab === 'all') return finances.records;
    return finances.records.filter((r) => r.category === activeTab);
  }, [finances, activeTab]);

  const categorySubtotals = useMemo(() => {
    const map = new Map<FinanceRecord['category'], { budget: number; actual: number; label: string }>();
    for (const cat of FINANCE_CATEGORIES) {
      map.set(cat.key, { budget: 0, actual: 0, label: cat.label });
    }
    if (finances) {
      for (const r of finances.records) {
        const entry = map.get(r.category);
        if (entry) {
          entry.budget += r.budgetAmount;
          entry.actual += r.actualAmount;
        }
      }
    }
    return map;
  }, [finances]);

  const totalBudget = useMemo(
    () => finances?.summary.budget ?? 0,
    [finances]
  );
  const totalActual = useMemo(
    () => finances?.summary.actual ?? 0,
    [finances]
  );

  const dailyReportStats = useMemo(() => {
    const total = dailyReports.length;
    const totalPhotos = dailyReports.reduce((sum, r) => sum + (r.photos?.length || 0), 0);
    const latestReport = dailyReports[0];
    const reportsByNode = new Map<string, number>();
    dailyReports.forEach((r) => {
      if (r.progressNodeId) {
        reportsByNode.set(r.progressNodeId, (reportsByNode.get(r.progressNodeId) || 0) + 1);
      }
    });
    return { total, totalPhotos, latestReport, reportsByNode };
  }, [dailyReports]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700" />
          <div className="container relative py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 rounded bg-white/20" />
              <div className="h-10 w-3/4 rounded bg-white/20" />
              <div className="h-6 w-48 rounded bg-white/20" />
            </div>
          </div>
        </section>
        <section className="container py-8 -mt-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-slate-200 mb-3" />
                <div className="h-3 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-6 animate-pulse h-96" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="card p-6 animate-pulse h-48 mb-4" />
              <div className="card p-6 animate-pulse h-80" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container py-20 text-center">
        <div className="card p-12">
          <Activity className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <div className="text-lg font-semibold text-slate-700">提案不存在</div>
          <Link to="/proposals" className="btn-primary mt-5 inline-flex">
            <ArrowLeft className="w-4 h-4" />
            返回提案列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 grain-overlay" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,200,150,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(180,220,255,0.3), transparent 40%)',
          }}
        />
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-20 text-slate-50"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,40 C360,80 720,0 1440,24 L1440,80 L0,80 Z" />
        </svg>

        <div className="container relative py-10 md:py-14 text-white">
          <Link
            to="/proposals"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15 text-sm font-medium text-primary-100 hover:bg-white/20 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            返回提案广场
          </Link>

          <div className="flex flex-wrap items-start gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="hero-title text-3xl md:text-4xl lg:text-5xl !text-white">
                {proposal.communityName}
                <span className="text-accent-300 ml-2 md:ml-3">{proposal.buildingNumber}</span>
                <span className="text-xl md:text-2xl text-primary-200 ml-2 md:ml-3 font-normal">
                  加装电梯进度看板
                </span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-primary-100/90">
                全流程透明化追踪 · 施工进度实时同步 · 资金使用公开可查
              </p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>

          {voteResult && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-100">
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-accent-300" />
                投票率 {voteResult.votingRate.toFixed(1)}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success-400" />
                同意 {voteResult.agreeCount}户
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded',
                  voteResult.passed
                    ? 'bg-success-500/20 text-success-300'
                    : 'bg-danger-500/20 text-danger-300'
                )}
              >
                {voteResult.passed ? '✓ 投票通过' : '✗ 未达通过条件'}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="container py-8 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card p-5 grain-overlay">
            <InfoItem
              icon={Layers}
              label="总层数"
              value={`${proposal.totalFloors} 层`}
            />
          </div>
          <div className="card p-5 grain-overlay">
            <InfoItem
              icon={Users}
              label="总户数"
              value={`${proposal.totalHouseholds} 户`}
            />
          </div>
          <div className="card p-5 grain-overlay">
            <InfoItem
              icon={Coins}
              label="总造价"
              value={formatCurrency(proposal.estimatedTotalCost)}
            />
          </div>
          <div className="card p-5 grain-overlay">
            <InfoItem
              icon={Hammer}
              label="预计工期"
              value={`${proposal.estimatedDuration} 天`}
            />
          </div>
          <div className="card p-5 grain-overlay col-span-2 md:col-span-1">
            <InfoItem
              icon={Building2}
              label="发起方"
              value={proposal.initiator}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6 grain-overlay mb-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-lg">
                      施工进度时间轴
                    </h3>
                    <p className="text-xs text-slate-500">
                      共 {sortedProgress.length} 个阶段节点
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-primary-700">
                    {completedCount}
                    <span className="text-base text-slate-400 font-normal">
                      /{sortedProgress.length}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    完成度 {completionRate.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-6">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-success-400 via-primary-500 to-accent-500 transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="space-y-2">
                {sortedProgress.map((node) => (
                  <TimelineNode
                    key={node.id}
                    node={node}
                    reportCount={dailyReportStats.reportsByNode.get(node.id)}
                  />
                ))}
              </div>
            </div>

            <div className="card p-6 grain-overlay mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800">
                      施工日报
                    </h3>
                    <p className="text-xs text-slate-500">每日进度与照片记录</p>
                  </div>
                </div>
                <Link
                  to={`/proposal/${id}/daily-reports`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  查看全部
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
                  <div className="text-2xl font-display font-black text-primary-700">
                    {dailyReportStats.total}
                  </div>
                  <div className="text-[11px] text-primary-600 font-medium">累计日报</div>
                </div>
                <div className="p-3 rounded-xl bg-accent-50 border border-accent-100 text-center">
                  <div className="text-2xl font-display font-black text-accent-700">
                    {dailyReportStats.totalPhotos}
                  </div>
                  <div className="text-[11px] text-accent-600 font-medium">现场照片</div>
                </div>
              </div>

              {dailyReportStats.latestReport && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      {dailyReportStats.latestReport.reportDate}
                    </span>
                    {dailyReportStats.latestReport.weather && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 ml-auto">
                        <Cloud className="w-3 h-3" />
                        {dailyReportStats.latestReport.weather}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                    {dailyReportStats.latestReport.constructionContent}
                  </p>
                  {dailyReportStats.latestReport.photos && dailyReportStats.latestReport.photos.length > 0 && (
                    <div className="flex gap-1.5">
                      {dailyReportStats.latestReport.photos.slice(0, 3).map((photo, idx) => (
                        <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={photo.url}
                            alt={photo.description || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {dailyReportStats.latestReport.photos.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          +{dailyReportStats.latestReport.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {proposal?.status === 'construction' && (
                <Link
                  to={`/proposal/${id}/daily-reports`}
                  className="btn-primary w-full justify-center mt-4"
                >
                  <Plus className="w-4 h-4" />
                  提交今日日报
                </Link>
              )}
            </div>

            <div className="card p-6 grain-overlay">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-800">
                    施工节点完成度
                  </h3>
                  <p className="text-xs text-slate-500">6个标准施工阶段</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="url(#grad-completion)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={2 * Math.PI * 32 * (1 - completionRate / 100)}
                      className="transition-all duration-700"
                    />
                    <defs>
                      <linearGradient id="grad-completion" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#2C6783" />
                        <stop offset="100%" stopColor="#E36414" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-display font-black text-slate-800">
                      {completionRate.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">完成度</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 mb-2">
                    已完成 {completedCount} / 6 个节点
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => {
                      const node = sortedProgress[i];
                      const done = node?.status === 'completed';
                      const inProg = node?.status === 'in_progress';
                      return (
                        <div
                          key={i}
                          className={cn(
                            'aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all',
                            done
                              ? 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-sm'
                              : inProg
                              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm ring-2 ring-primary-200 animate-pulse-slow'
                              : 'bg-slate-100 text-slate-400'
                          )}
                          title={node?.title || `阶段 ${i + 1}`}
                        >
                          {done ? '✓' : i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {finances && <FinanceSummaryCard summary={finances.summary} />}

            <div className="card grain-overlay overflow-hidden">
              <div className="p-6 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-800 text-lg">
                        工程资金明细
                      </h3>
                      <p className="text-xs text-slate-500">
                        {finances?.records.length ?? 0} 条支出记录
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pt-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 overflow-x-auto scrollbar-none">
                  {TAB_OPTIONS.map((opt) => {
                    const active = activeTab === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setActiveTab(opt.key)}
                        className={cn('tab-btn', active && 'tab-btn-active')}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6">
                {filteredRecords.length === 0 ? (
                  <div className="py-12 text-center">
                    <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <div className="text-sm text-slate-500">暂无该类别支出记录</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">
                            类别
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">
                            描述
                          </th>
                          <th className="text-right text-xs font-semibold text-slate-500 py-3 px-3">
                            预算
                          </th>
                          <th className="text-right text-xs font-semibold text-slate-500 py-3 px-3">
                            实际
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">
                            日期
                          </th>
                          <th className="text-center text-xs font-semibold text-slate-500 py-3 px-3">
                            凭证
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((r, idx) => {
                          const over = r.actualAmount > r.budgetAmount;
                          return (
                            <tr
                              key={r.id}
                              className={cn(
                                'border-b border-slate-100 transition-colors hover:bg-primary-50/30',
                                idx % 2 === 1 && 'bg-slate-50/40'
                              )}
                            >
                              <td className="py-3.5 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                                  {r.categoryName}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-sm text-slate-700 font-medium">
                                {r.description}
                              </td>
                              <td className="py-3.5 px-3 text-right text-sm text-slate-600 font-medium tabular-nums">
                                {formatCurrency(r.budgetAmount)}
                              </td>
                              <td className="py-3.5 px-3 text-right text-sm font-bold tabular-nums">
                                <span className={cn(over && 'text-danger-600', !over && 'text-slate-800')}>
                                  {formatCurrency(r.actualAmount)}
                                  {over && <span className="text-[10px] ml-1">↑超</span>}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-sm text-slate-500 whitespace-nowrap">
                                {r.expenseDate}
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                {r.voucherUrl ? (
                                  <button
                                    onClick={() =>
                                      useUIStore.getState().showToast('凭证预览功能开发中', 'info')
                                    }
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                                    title="查看凭证"
                                  >
                                    <Paperclip className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {activeTab === 'all' && (
                          <>
                            {[...categorySubtotals.entries()].map(([key, val]) => {
                              if (val.budget === 0 && val.actual === 0) return null;
                              const over = val.actual > val.budget;
                              return (
                                <tr
                                  key={`sub-${key}`}
                                  className="bg-slate-50/80 border-b border-slate-200/60"
                                >
                                  <td className="py-3 px-3" colSpan={2}>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                      小计 · {val.label}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right text-xs font-bold text-slate-600 tabular-nums">
                                    {formatCurrency(val.budget)}
                                  </td>
                                  <td
                                    className={cn(
                                      'py-3 px-3 text-right text-xs font-bold tabular-nums',
                                      over ? 'text-danger-600' : 'text-slate-800'
                                    )}
                                  >
                                    {formatCurrency(val.actual)}
                                  </td>
                                  <td colSpan={2} />
                                </tr>
                              );
                            })}
                            <tr className="bg-gradient-to-r from-primary-50 to-accent-50 border-t-2 border-primary-200">
                              <td className="py-4 px-3" colSpan={2}>
                                <span className="inline-flex items-center gap-2 text-sm font-bold text-primary-900">
                                  <TrendingUp className="w-4 h-4 text-accent-600" />
                                  合计
                                </span>
                              </td>
                              <td className="py-4 px-3 text-right text-sm font-bold text-slate-800 tabular-nums">
                                {formatCurrency(totalBudget)}
                              </td>
                              <td className="py-4 px-3 text-right text-sm font-black text-primary-800 tabular-nums">
                                {formatCurrency(totalActual)}
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6 grain-overlay">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-800 text-lg">工程文档附件</h3>
                  <p className="text-xs text-slate-500">施工相关资料与备案文件</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DOCUMENT_EXAMPLES.map((doc, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      useUIStore.getState().showToast(`${doc.name} 预览功能开发中`, 'info')
                    }
                    className="group relative flex items-center gap-3 p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 hover:bg-white hover:border-primary-200 hover:shadow-card transition-all duration-300 text-left"
                  >
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                        doc.type === 'pdf'
                          ? 'bg-danger-100 group-hover:bg-danger-200'
                          : 'bg-primary-100 group-hover:bg-primary-200'
                      )}
                    >
                      <FileText
                        className={cn(
                          'w-5 h-5',
                          doc.type === 'pdf' ? 'text-danger-600' : 'text-primary-700'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 uppercase">
                        {doc.type}
                      </div>
                    </div>
                    <Paperclip className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
