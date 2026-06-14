import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Coins,
  CalendarDays,
  CheckCircle2,
  Users,
  Building2,
  TrendingUp,
  GitCompare,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import api, { type ProposalWithResult } from '../lib/apiClient';
import { STATUS_LABELS, STATUS_COLORS } from '../../shared/types';
import { formatCurrency } from '../../shared/calculator';
import { cn } from '../lib/utils';

interface CompareMetric {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; color?: string }>;
  color: string;
  gradient: string;
  format: (p: ProposalWithResult) => string | number;
  highlightBest?: 'min' | 'max' | 'rate';
  suffix?: string;
}

const COMPARE_METRICS: CompareMetric[] = [
  {
    key: 'totalCost',
    label: '总费用',
    icon: Coins,
    color: '#059669',
    gradient: '#059669 #10B981',
    format: (p) => formatCurrency(p.estimatedTotalCost),
    highlightBest: 'min',
    suffix: '越低越好',
  },
  {
    key: 'duration',
    label: '施工周期',
    icon: CalendarDays,
    color: '#7C3AED',
    gradient: '#7C3AED #4F46E5',
    format: (p) => `${p.estimatedDuration} 天`,
    highlightBest: 'min',
    suffix: '越短越好',
  },
  {
    key: 'passRate',
    label: '投票通过率',
    icon: CheckCircle2,
    color: '#0F4C5C',
    gradient: '#0F4C5C #2C6783',
    format: (p) => (p.voteResult ? `${p.voteResult.weightedAgreeRate.toFixed(1)}%` : '暂无数据'),
    highlightBest: 'rate',
    suffix: '越高越好',
  },
  {
    key: 'households',
    label: '涉及户数',
    icon: Users,
    color: '#E36414',
    gradient: '#E36414 #F59E0B',
    format: (p) => `${p.totalHouseholds} 户`,
  },
];

function MetricCard({
  metric,
  proposals,
  values,
}: {
  metric: CompareMetric;
  proposals: ProposalWithResult[];
  values: (string | number)[];
}) {
  const bestIndex = useMemo(() => {
    if (!metric.highlightBest) return -1;

    const numericValues = proposals.map((p, i) => {
      if (metric.highlightBest === 'rate') {
        return p.voteResult ? p.voteResult.weightedAgreeRate : -Infinity;
      }
      if (metric.key === 'totalCost') return p.estimatedTotalCost;
      if (metric.key === 'duration') return p.estimatedDuration;
      return Number(values[i]) || 0;
    });

    if (metric.highlightBest === 'min') {
      const validValues = numericValues.filter((v) => v > 0);
      if (validValues.length === 0) return -1;
      const min = Math.min(...validValues);
      return numericValues.indexOf(min);
    }

    if (metric.highlightBest === 'max' || metric.highlightBest === 'rate') {
      const max = Math.max(...numericValues);
      if (max === -Infinity) return -1;
      return numericValues.indexOf(max);
    }

    return -1;
  }, [metric, proposals, values]);

  const Icon = metric.icon;

  return (
    <div className="card p-6 grain-overlay">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: metric.gradient + '22' }}
        >
          <Icon className="w-6 h-6" color={metric.color} />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800">{metric.label}</h3>
          {metric.suffix && (
            <span className="text-xs text-slate-500">{metric.suffix}</span>
          )}
        </div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${proposals.length}, 1fr)` }}>
        {proposals.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'rounded-xl p-4 text-center transition-all',
              bestIndex === i
                ? 'bg-gradient-to-br from-success-50 to-success-100 border-2 border-success-300'
                : 'bg-slate-50 border border-slate-200'
            )}
          >
            {bestIndex === i && (
              <div className="flex items-center justify-center gap-1 text-success-600 text-xs font-semibold mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                最优
              </div>
            )}
            <div
              className={cn(
                'text-2xl font-display font-black',
                bestIndex === i ? 'text-success-700' : 'text-slate-800'
              )}
            >
              {values[i]}
            </div>
            {metric.key === 'passRate' && p.voteResult && (
              <div className="mt-2">
                <div className="text-xs text-slate-500 mb-1">
                  参与率 {p.voteResult.votingRate.toFixed(1)}%
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      p.voteResult.passed
                        ? 'bg-gradient-to-r from-success-400 to-success-500'
                        : 'bg-gradient-to-r from-danger-400 to-danger-500'
                    )}
                    style={{ width: `${Math.min(100, p.voteResult.weightedAgreeRate)}%` }}
                  />
                </div>
                <div
                  className={cn(
                    'text-xs font-semibold mt-1 flex items-center justify-center gap-1',
                    p.voteResult.passed ? 'text-success-600' : 'text-danger-600'
                  )}
                >
                  {p.voteResult.passed ? (
                    <><CheckCircle className="w-3 h-3" /> 已通过</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> 未通过</>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProposalComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [proposals, setProposals] = useState<ProposalWithResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ids = useMemo(() => {
    const idsParam = searchParams.get('ids');
    if (!idsParam) return [];
    return idsParam.split(',').filter(Boolean);
  }, [searchParams]);

  useEffect(() => {
    if (ids.length < 2 || ids.length > 4) {
      setError('请选择 2-4 个提案进行对比');
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const allProposals = await api.getProposals();
        const filtered = allProposals.filter((p) => ids.includes(p.id));
        const sorted = ids.map((id) => filtered.find((p) => p.id === id)).filter(Boolean) as ProposalWithResult[];

        if (sorted.length < 2) {
          setError('未找到足够的提案数据');
          return;
        }

        if (alive) {
          setProposals(sorted);
        }
      } catch (e) {
        if (alive) {
          setError((e as Error).message);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [ids]);

  const gridCols = useMemo(() => {
    const count = proposals.length;
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    return 'grid-cols-4';
  }, [proposals.length]);

  if (loading) {
    return (
      <div className="container py-10">
        <div className="card p-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-slate-200 rounded mx-auto mb-4" />
            <div className="h-4 w-48 bg-slate-100 rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="card p-16 text-center">
          <AlertCircle className="w-14 h-14 mx-auto text-danger-400 mb-4" />
          <div className="text-lg font-semibold text-slate-700 mb-2">{error}</div>
          <Link to="/proposals" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回提案列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 grain-overlay" />
        <svg className="absolute bottom-0 left-0 right-0 w-full h-24 text-slate-50" viewBox="0 0 1440 96" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,48 C360,96 720,0 1440,32 L1440,96 L0,96 Z" />
        </svg>
        <div className="container relative py-12 md:py-16 text-white">
          <button
            onClick={() => navigate('/proposals')}
            className="inline-flex items-center gap-2 text-primary-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回提案列表
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black">多提案横向对比</h1>
              <p className="text-primary-200 text-sm">共 {proposals.length} 个提案参与对比</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container py-10">
        {/* 提案标题卡片 */}
        <div className={cn('grid gap-5 mb-8', gridCols)}>
          {proposals.map((p) => (
            <div key={p.id} className="card p-6 text-center grain-overlay">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 border border-primary-200 flex flex-col items-center justify-center shadow-inner-subtle mx-auto mb-4">
                <Building2 className="w-7 h-7 text-primary-700 mb-0.5" />
                <span className="text-[11px] font-bold text-primary-800 tracking-wide">
                  {p.buildingNumber.replace(/[^\d]/g, '')}#
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-800 mb-1">
                {p.communityName}
              </h3>
              <p className="text-primary-700 font-semibold mb-3">{p.buildingNumber}</p>
              <span className={cn('badge text-xs', STATUS_COLORS[p.status])}>
                {STATUS_LABELS[p.status]}
              </span>
              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CalendarDays className="w-3 h-3" />
                  {p.votingStartDate} ~ {p.votingEndDate}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {p.totalFloors}层 · {p.unitsCount}单元
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 对比指标 */}
        <div className="space-y-6">
          {COMPARE_METRICS.map((metric) => (
            <MetricCard
              key={metric.key}
              metric={metric}
              proposals={proposals}
              values={proposals.map((p) => metric.format(p))}
            />
          ))}
        </div>

        {/* 电梯方案对比 */}
        <div className="card p-6 mt-6 grain-overlay">
          <h3 className="font-display font-bold text-lg text-slate-800 mb-4">电梯方案</h3>
          <div className={cn('grid gap-4', gridCols)}>
            {proposals.map((p) => (
              <div key={p.id} className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed">{p.elevatorPlan}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 mt-8">
          <Link to="/proposals" className="btn-outline !px-6 !py-2.5">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </section>
    </div>
  );
}
