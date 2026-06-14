import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Send,
  ChevronDown,
  Building2,
  UserCheck,
  Home,
  ChevronRight,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api, { type EnrichedAppeal } from '../lib/apiClient';
import {
  APPEAL_STATUS_LABELS,
  APPEAL_STATUS_COLORS,
  type AppealStatus,
} from '../../shared/types';
import { cn } from '../lib/utils';

const STATUS_FILTER_OPTIONS: Array<{ key: AppealStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'reviewed', label: '已受理' },
  { key: 'resolved', label: '已解决' },
  { key: 'rejected', label: '已驳回' },
];

const STATUS_ICON: Record<AppealStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  reviewed: Eye,
  resolved: CheckCircle2,
  rejected: XCircle,
};

function ReviewModal({
  appeal,
  onClose,
  onSubmit,
  loading,
}: {
  appeal: EnrichedAppeal;
  onClose: () => void;
  onSubmit: (status: AppealStatus, reply: string, reviewer: string) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState<AppealStatus>(appeal.status === 'pending' ? 'reviewed' : appeal.status);
  const [reply, setReply] = useState(appeal.reply ?? '');
  const [reviewer, setReviewer] = useState(appeal.reviewer ?? '管理员');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">审核申诉</h3>
                <p className="text-xs text-slate-500">
                  {appeal.proposal?.communityName} {appeal.proposal?.buildingNumber}
                  {appeal.household ? ` · ${appeal.household.unit}单元${appeal.household.floor}层${appeal.household.roomNumber}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 mb-2">申诉理由</div>
            <p className="text-sm text-slate-700 leading-relaxed">{appeal.reason}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {appeal.createdAt}
              </span>
              <span className={cn('badge text-[11px]', APPEAL_STATUS_COLORS[appeal.status])}>
                {APPEAL_STATUS_LABELS[appeal.status]}
              </span>
            </div>
          </div>

          {appeal.reply && (
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-200">
              <div className="text-xs font-semibold text-primary-600 mb-2">当前回复</div>
              <p className="text-sm text-slate-700 leading-relaxed">{appeal.reply}</p>
              {appeal.reviewer && (
                <div className="mt-2 text-xs text-slate-500">
                  回复人：{appeal.reviewer} · {appeal.reviewedAt}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label-base">处理状态</label>
            <div className="grid grid-cols-3 gap-3">
              {(['reviewed', 'resolved', 'rejected'] as AppealStatus[]).map((s) => {
                const Icon = STATUS_ICON[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all duration-200',
                      active
                        ? s === 'reviewed'
                          ? 'border-primary-500 bg-primary-50'
                          : s === 'resolved'
                          ? 'border-success-500 bg-success-50'
                          : 'border-danger-500 bg-danger-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 mx-auto mb-1', active ? (s === 'resolved' ? 'text-success-600' : s === 'rejected' ? 'text-danger-600' : 'text-primary-600') : 'text-slate-400')} />
                    <div className={cn('text-xs font-semibold', active ? 'text-slate-900' : 'text-slate-500')}>
                      {APPEAL_STATUS_LABELS[s]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label-base">回复意见</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value.slice(0, 1000))}
              placeholder="请输入审核回复意见..."
              rows={4}
              className="input-base resize-none"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{reply.length}/1000</div>
          </div>

          <div>
            <label className="label-base">审核人</label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="请输入审核人姓名"
              className="input-base"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline !px-5 !py-2.5">
            取消
          </button>
          <button
            onClick={() => onSubmit(status, reply, reviewer)}
            disabled={loading || !reply.trim()}
            className="btn-primary !px-5 !py-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交审核
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppealsAdminPage() {
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [appeals, setAppeals] = useState<EnrichedAppeal[]>([]);
  const [filterStatus, setFilterStatus] = useState<AppealStatus | 'all'>('all');
  const [reviewingAppeal, setReviewingAppeal] = useState<EnrichedAppeal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppeals = async () => {
    setLoading(true);
    try {
      const list = await api.getAllAppeals({
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setAppeals(list);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals();
  }, [filterStatus]);

  const handleReview = async (status: AppealStatus, reply: string, reviewer: string) => {
    if (!reviewingAppeal) return;
    setSubmitting(true);
    try {
      await api.reviewAppeal(reviewingAppeal.id, { status, reply, reviewer });
      showToast('审核提交成功', 'success');
      setReviewingAppeal(null);
      fetchAppeals();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = appeals.filter((a) => a.status === 'pending').length;

  const statusSummary = {
    pending: appeals.filter((a) => a.status === 'pending').length,
    reviewed: appeals.filter((a) => a.status === 'reviewed').length,
    resolved: appeals.filter((a) => a.status === 'resolved').length,
    rejected: appeals.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="container py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/proposals" className="inline-flex items-center gap-1.5 hover:text-primary-700 transition-colors">
          <Home className="w-4 h-4" />
          提案广场
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-medium">异议申诉审核</span>
      </nav>

      <div className="card p-6 mb-6 relative overflow-hidden grain-overlay">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 opacity-60" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">
                异议申诉审核
              </h1>
              {pendingCount > 0 && (
                <span className="badge bg-danger-100 text-danger-700 border-danger-200 animate-pulse">
                  {pendingCount} 条待处理
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              管理员可对业主提交的异议申诉进行审核、标记处理状态并填写回复意见
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-center">
              {(['pending', 'reviewed', 'resolved', 'rejected'] as AppealStatus[]).map((s) => {
                const Icon = STATUS_ICON[s];
                return (
                  <div key={s} className="px-3 py-2 rounded-lg bg-white border border-slate-200">
                    <Icon className={cn('w-4 h-4 mx-auto mb-1', s === 'pending' ? 'text-yellow-600' : s === 'reviewed' ? 'text-primary-600' : s === 'resolved' ? 'text-success-600' : 'text-danger-600')} />
                    <div className="text-lg font-bold text-slate-800">{statusSummary[s]}</div>
                    <div className="text-[10px] text-slate-500">{APPEAL_STATUS_LABELS[s]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/70 overflow-x-auto scrollbar-none">
          <span className="inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            状态
          </span>
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const active = filterStatus === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilterStatus(opt.key)}
                className={cn('tab-btn', active && 'tab-btn-active')}
              >
                {opt.label}
                {opt.key !== 'all' && statusSummary[opt.key] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-600">
                    {statusSummary[opt.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <div className="card p-16 text-center">
          <ShieldAlert className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <div className="text-lg font-semibold text-slate-700">暂无申诉记录</div>
          <div className="text-sm text-slate-500 mt-1">
            {filterStatus !== 'all' ? '当前筛选条件下没有申诉，尝试查看全部' : '目前没有任何异议申诉'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((a) => {
            const Icon = STATUS_ICON[a.status];
            return (
              <div
                key={a.id}
                className={cn(
                  'card p-6 transition-all duration-200',
                  a.status === 'pending' && 'border-l-4 border-l-yellow-400'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        a.status === 'pending' && 'bg-yellow-100 text-yellow-600',
                        a.status === 'reviewed' && 'bg-primary-100 text-primary-600',
                        a.status === 'resolved' && 'bg-success-100 text-success-600',
                        a.status === 'rejected' && 'bg-danger-100 text-danger-600'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn('badge', APPEAL_STATUS_COLORS[a.status])}>
                          {APPEAL_STATUS_LABELS[a.status]}
                        </span>
                        {a.proposal && (
                          <Link
                            to={`/proposal/${a.proposalId}/vote`}
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors"
                          >
                            <Building2 className="w-3 h-3" />
                            {a.proposal.communityName} {a.proposal.buildingNumber}
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        {a.household && (
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {a.household.unit}单元 {a.household.floor}层 {a.household.roomNumber}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          提交于 {a.createdAt}
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">{a.reason}</p>

                      {a.reply && (
                        <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary-500" />
                            <span className="text-xs font-semibold text-slate-700">官方回复</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{a.reply}</p>
                          {(a.reviewer || a.reviewedAt) && (
                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-400 flex items-center gap-3">
                              {a.reviewer && <span>审核人：{a.reviewer}</span>}
                              {a.reviewedAt && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {a.reviewedAt}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    {a.status === 'pending' && (
                      <button
                        onClick={() => setReviewingAppeal(a)}
                        className="btn-primary !px-4 !py-2.5"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        审核处理
                      </button>
                    )}
                    {a.status !== 'pending' && (
                      <button
                        onClick={() => setReviewingAppeal(a)}
                        className="btn-outline !px-4 !py-2.5"
                      >
                        <RotateCcw className="w-4 h-4" />
                        重新审核
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewingAppeal && (
        <ReviewModal
          appeal={reviewingAppeal}
          onClose={() => setReviewingAppeal(null)}
          onSubmit={handleReview}
          loading={submitting}
        />
      )}
    </div>
  );
}
