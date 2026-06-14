import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  TrendingUp,
  Hammer,
  CheckCircle2,
  Users,
  Coins,
  CalendarDays,
  ArrowRight,
  Vote,
  Gauge,
  Layers,
  GitCompare,
  Square,
  CheckSquare,
  X,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api, { type ProposalWithResult, type Stats } from '../lib/apiClient';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type ProposalStatus,
} from '../../shared/types';
import { formatCurrency } from '../../shared/calculator';
import { cn } from '../lib/utils';

const FILTER_OPTIONS: Array<{ key: ProposalStatus | 'all'; label: string; countKey?: keyof Stats }> = [
  { key: 'all', label: '全部' },
  { key: 'voting', label: '投票中', countKey: 'voting' },
  { key: 'public_notice', label: '公示中' },
  { key: 'appealing', label: '申诉中' },
  { key: 'construction', label: '施工中', countKey: 'construction' },
  { key: 'completed', label: '已完工', countKey: 'completed' },
  { key: 'rejected', label: '未通过' },
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  color,
}: {
  icon: React.ComponentType<{ className?: string; color?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  color: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden grain-overlay">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10" style={{ background: gradient }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: gradient + '22' }}>
            <Icon className="w-5 h-5" color={color} />
          </div>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-display font-black text-slate-800 leading-tight">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function ProposalCard({
  p,
  selected,
  onToggleSelect,
}: {
  p: ProposalWithResult;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const result = p.voteResult;
  const votingProgress = useMemo(() => {
    if (!result) return 0;
    return Math.min(100, result.votingRate);
  }, [result]);

  return (
    <div
      className={cn(
        'card p-6 group hover:-translate-y-0.5 grain-overlay relative transition-all duration-200',
        selected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleSelect(p.id);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors z-10"
        title={selected ? '取消选择' : '选择对比'}
      >
        {selected ? (
          <CheckSquare className="w-5 h-5 text-primary-600" />
        ) : (
          <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
        )}
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 border border-primary-200 flex flex-col items-center justify-center shadow-inner-subtle">
            <Building2 className="w-6 h-6 text-primary-700 mb-1" />
            <span className="text-[11px] font-bold text-primary-800 tracking-wide">
              {p.buildingNumber.replace(/[^\d]/g, '')}#
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 leading-snug">
                {p.communityName}
                <span className="text-primary-700 ml-2">{p.buildingNumber}</span>
              </h3>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {p.totalFloors}层 · {p.unitsCount}单元 · {p.totalHouseholds}户
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {p.votingStartDate} ~ {p.votingEndDate}
                </span>
              </div>
            </div>
            <span className={cn('badge', STATUS_COLORS[p.status])}>{STATUS_LABELS[p.status]}</span>
          </div>

          <p className="text-sm text-slate-600 line-clamp-2 mb-4">{p.elevatorPlan}</p>

          {result && p.status !== 'rejected' && p.status !== 'completed' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium text-slate-700">
                  投票进度 <span className="text-slate-500 font-normal">({result.votedCount}/{result.totalHouseholds})</span>
                </span>
                <span className="font-semibold text-primary-700">{result.votingRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400 transition-all duration-700"
                  style={{ width: `${votingProgress}%` }}
                />
              </div>
              {result.votedCount > 0 && (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-success-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    同意 {result.agreeCount}
                    <span className="text-slate-400">({result.weightedAgreeRate}%权重)</span>
                  </span>
                  <span className="text-danger-600 font-medium">反对 {result.disagreeCount}</span>
                  <span className="text-slate-500">弃权 {result.abstainCount}</span>
                  {(p.status === 'public_notice' || p.status === 'construction' || p.status === 'approved' || p.status === 'voting') && (
                    <span
                      className={cn(
                        'ml-auto font-bold',
                        result.passed ? 'text-success-700' : 'text-danger-700'
                      )}
                    >
                      {result.passed ? '✓ 已通过' : '✗ 未通过'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-100">
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Coins className="w-4 h-4 text-accent-500" />
                <span className="font-semibold text-slate-800">{formatCurrency(p.estimatedTotalCost)}</span>
                <span className="text-xs text-slate-400">总造价</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                发起：{p.initiator}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/proposal/${p.id}/vote`}
                className="btn-outline !px-3.5 !py-1.5 !text-xs"
              >
                <Vote className="w-3.5 h-3.5" />
                投票面板
              </Link>
              <Link
                to={`/proposal/${p.id}/progress`}
                className="btn-primary !px-3.5 !py-1.5 !text-xs"
              >
                <Gauge className="w-3.5 h-3.5" />
                进度看板
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProposalsPage() {
  const navigate = useNavigate();
  const proposals = useUIStore((s) => s.proposals);
  const setProposals = useUIStore((s) => s.setProposals);
  const loading = useUIStore((s) => s.loading);
  const setLoading = useUIStore((s) => s.setLoading);
  const filterStatus = useUIStore((s) => s.filterStatus);
  const setFilterStatus = useUIStore((s) => s.setFilterStatus);
  const keyword = useUIStore((s) => s.keyword);
  const setKeyword = useUIStore((s) => s.setKeyword);
  const showToast = useUIStore((s) => s.showToast);
  const selectedProposalIds = useUIStore((s) => s.selectedProposalIds);
  const toggleSelectedProposal = useUIStore((s) => s.toggleSelectedProposal);
  const clearSelectedProposals = useUIStore((s) => s.clearSelectedProposals);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [list, st] = await Promise.all([
          api.getProposals({ status: filterStatus === 'all' ? undefined : filterStatus, search: keyword || undefined }),
          api.getStats(),
        ]);
        if (!alive) return;
        setProposals(list);
        setStats(st);
      } catch (e) {
        showToast((e as Error).message, 'error');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, keyword]);

  const displayStats: Stats = stats ?? {
    total: proposals.length,
    voting: proposals.filter((p) => p.status === 'voting').length,
    construction: proposals.filter((p) => p.status === 'construction').length,
    completed: proposals.filter((p) => p.status === 'completed').length,
    households: proposals.reduce((s, p) => s + p.totalHouseholds, 0),
    totalCost: proposals
      .filter((p) => p.status === 'construction' || p.status === 'completed')
      .reduce((s, p) => s + p.estimatedTotalCost, 0),
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 grain-overlay" />
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,200,150,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(180,220,255,0.3), transparent 40%)" }} />
        <svg className="absolute bottom-0 left-0 right-0 w-full h-24 text-slate-50" viewBox="0 0 1440 96" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,48 C360,96 720,0 1440,32 L1440,96 L0,96 Z" />
        </svg>
        <div className="container relative py-16 md:py-20 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium text-primary-100 mb-5">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              阳光社区数字化治理 · 2026 版
            </div>
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl !text-white leading-tight">
              老旧小区加装电梯
              <br />
              <span className="bg-gradient-to-r from-accent-300 to-accent-200 bg-clip-text text-transparent">
                居民投票与进度追踪平台
              </span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-primary-100 max-w-2xl leading-relaxed">
              公开透明的线上投票机制、科学合理的楼层系数费用分摊算法、实时可查的施工进度与资金明细，
              让每一位业主都能安心参与家门口的民生工程。
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl">
            <StatCard
              icon={Building2}
              label="累计提案"
              value={displayStats.total}
              sub="栋楼"
              gradient="#E36414 #F59E0B"
              color="#E36414"
            />
            <StatCard
              icon={Users}
              label="覆盖住户"
              value={displayStats.households}
              sub="户居民"
              gradient="#0F4C5C #2C6783"
              color="#0F4C5C"
            />
            <StatCard
              icon={Hammer}
              label="施工进行中"
              value={displayStats.construction}
              sub="项工程"
              gradient="#7C3AED #4F46E5"
              color="#7C3AED"
            />
            <StatCard
              icon={Coins}
              label="完工总投入"
              value={formatCurrency(displayStats.totalCost)}
              sub={displayStats.completed + ' 栋已交付'}
              gradient="#059669 #10B981"
              color="#059669"
            />
          </div>
        </div>
      </section>

      {/* 筛选 + 列表 */}
      <section className="container py-10">
        <div className="card p-4 md:p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/70 overflow-x-auto scrollbar-none">
              <span className="inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                状态
              </span>
              {FILTER_OPTIONS.map((opt) => {
                const active = filterStatus === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFilterStatus(opt.key)}
                    className={cn('tab-btn', active && 'tab-btn-active')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input-base !pl-10"
                placeholder="搜索小区或楼栋号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 对比操作栏 */}
        {selectedProposalIds.length > 0 && (
          <div className="card p-4 mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <GitCompare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800">已选择 {selectedProposalIds.length} 个提案</div>
                  <div className="text-xs text-slate-500">请选择 2-4 个提案进行横向对比</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSelectedProposals}
                  className="btn-outline !px-4 !py-2 !text-sm"
                >
                  <X className="w-4 h-4" />
                  清除选择
                </button>
                <button
                  onClick={() => {
                    if (selectedProposalIds.length < 2) {
                      showToast('请至少选择 2 个提案进行对比', 'error');
                      return;
                    }
                    navigate(`/proposals/compare?ids=${selectedProposalIds.join(',')}`);
                  }}
                  disabled={selectedProposalIds.length < 2}
                  className={cn(
                    'btn-primary !px-4 !py-2 !text-sm',
                    selectedProposalIds.length < 2 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <GitCompare className="w-4 h-4" />
                  开始对比
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-1/2 bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-100 rounded" />
                    <div className="h-3 w-3/4 bg-slate-100 rounded" />
                    <div className="h-2 w-full bg-slate-100 rounded-full" />
                    <div className="h-8 w-full bg-slate-50 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="card p-16 text-center">
            <Building2 className="w-14 h-14 mx-auto text-slate-300 mb-4" />
            <div className="text-lg font-semibold text-slate-700">暂无符合条件的提案</div>
            <div className="text-sm text-slate-500 mt-1">尝试切换筛选条件，或发起新的加装电梯提案</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {proposals.map((p) => (
              <ProposalCard
                key={p.id}
                p={p}
                selected={selectedProposalIds.includes(p.id)}
                onToggleSelect={toggleSelectedProposal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
