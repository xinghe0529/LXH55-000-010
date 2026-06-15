import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Building2,
  UserCheck,
  Home,
  ChevronRight,
  MessageSquare,
  Volume2,
  ShieldAlert,
  Wrench,
  Calendar,
  MoreHorizontal,
  User,
  X,
  ArrowLeft,
  PlayCircle,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_CATEGORY_COLORS,
  ISSUE_STATUS_COLORS,
  ISSUE_PRIORITY_COLORS,
  type IssueFeedbackStatus,
  type IssueFeedbackCategory,
  type IssueFeedbackPriority,
  type IssueFeedback,
  type IssueFeedbackReply,
} from '../../shared/types';
import { cn } from '../lib/utils';

type EnrichedIssue = IssueFeedback & {
  proposal: { id: string; communityName: string; buildingNumber: string; status: string } | null;
  household: { id: string; unit: string; floor: number; roomNumber: string } | null;
  progressNode: { id: string; title: string; stepIndex: number } | null;
};

const STATUS_FILTER_OPTIONS: Array<{ key: IssueFeedbackStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' },
];

const CATEGORY_FILTER_OPTIONS: Array<{ key: IssueFeedbackCategory | 'all'; label: string }> = [
  { key: 'all', label: '全部分类' },
  { key: 'noise', label: '噪音扰民' },
  { key: 'safety', label: '安全隐患' },
  { key: 'quality', label: '施工质量' },
  { key: 'schedule', label: '工期进度' },
  { key: 'other', label: '其他问题' },
];

const STATUS_ICON: Record<IssueFeedbackStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  processing: PlayCircle,
  resolved: CheckCircle2,
  closed: XCircle,
};

const CATEGORY_ICON: Record<IssueFeedbackCategory, React.ComponentType<{ className?: string }>> = {
  noise: Volume2,
  safety: ShieldAlert,
  quality: Wrench,
  schedule: Calendar,
  other: MoreHorizontal,
};

function IssueDetailModal({
  issue,
  onClose,
  onStatusChange,
  onAddReply,
  loading,
}: {
  issue: EnrichedIssue;
  onClose: () => void;
  onStatusChange: (status: IssueFeedbackStatus, assignedTo?: string) => void;
  onAddReply: (content: string, replier: string, replierRole: 'construction' | 'admin') => void;
  loading: boolean;
}) {
  const [replyContent, setReplyContent] = useState('');
  const [replierName, setReplierName] = useState('管理员');
  const [replierRole, setReplierRole] = useState<'construction' | 'admin'>('admin');
  const [newStatus, setNewStatus] = useState<IssueFeedbackStatus>(issue.status);
  const [assignedTo, setAssignedTo] = useState(issue.assignedTo || '');

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;
    onAddReply(replyContent, replierName, replierRole);
    setReplyContent('');
  };

  const handleStatusChange = () => {
    if (newStatus !== issue.status) {
      onStatusChange(newStatus, assignedTo || undefined);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                ISSUE_PRIORITY_COLORS[issue.priority]
              )}
            >
              {issue.priority === 'urgent' ? (
                <Zap className="w-5 h-5" />
              ) : issue.priority === 'high' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">问题反馈详情</h3>
              <p className="text-xs text-slate-500">
                {issue.proposal?.communityName} {issue.proposal?.buildingNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('badge', ISSUE_STATUS_COLORS[issue.status])}>
              {ISSUE_STATUS_LABELS[issue.status]}
            </span>
            <span className={cn('badge', ISSUE_CATEGORY_COLORS[issue.category])}>
              {ISSUE_CATEGORY_LABELS[issue.category]}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold',
                ISSUE_PRIORITY_COLORS[issue.priority]
              )}
            >
              {ISSUE_PRIORITY_LABELS[issue.priority]}优先级
            </span>
            {issue.progressNode && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                <Calendar className="w-3 h-3" />
                {issue.progressNode.title}
              </span>
            )}
          </div>

          <h4 className="font-bold text-xl text-slate-800">{issue.title}</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">提交人</div>
              <div className="font-medium text-slate-700">
                {issue.household
                  ? `${issue.household.unit}单元${issue.household.floor}层${issue.household.roomNumber}`
                  : '未知'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">提交时间</div>
              <div className="font-medium text-slate-700">
                {new Date(issue.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">更新时间</div>
              <div className="font-medium text-slate-700">
                {new Date(issue.updatedAt).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">处理人</div>
              <div className="font-medium text-slate-700">{issue.assignedTo || '未分配'}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 mb-2">问题描述</div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>

          {issue.photos && issue.photos.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">现场照片</div>
              <div className="grid grid-cols-4 gap-2">
                {issue.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200"
                  >
                    <img
                      src={photo.url}
                      alt={photo.description || ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-slate-800">沟通记录</span>
              <span className="text-xs text-slate-500">({issue.replies.length} 条回复)</span>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700">业主</span>
                    <span className="text-xs text-slate-400">
                      {new Date(issue.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 text-sm text-slate-700">
                    {issue.description}
                  </div>
                </div>
              </div>

              {issue.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      reply.replierRole === 'admin'
                        ? 'bg-purple-100'
                        : reply.replierRole === 'construction'
                        ? 'bg-green-100'
                        : 'bg-blue-100'
                    )}
                  >
                    <User
                      className={cn(
                        'w-4 h-4',
                        reply.replierRole === 'admin'
                          ? 'text-purple-600'
                          : reply.replierRole === 'construction'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700">{reply.replier}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded',
                          reply.replierRole === 'admin'
                            ? 'bg-purple-100 text-purple-600'
                            : reply.replierRole === 'construction'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-blue-100 text-blue-600'
                        )}
                      >
                        {reply.replierRole === 'admin'
                          ? '管理员'
                          : reply.replierRole === 'construction'
                          ? '施工方'
                          : '业主'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(reply.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'p-3 rounded-xl text-sm text-slate-700',
                        reply.replierRole === 'household' ? 'bg-slate-100' : 'bg-primary-50'
                      )}
                    >
                      {reply.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-200">
            <div className="text-sm font-semibold text-primary-700 mb-3">添加回复</div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">回复人身份</label>
                  <select
                    value={replierRole}
                    onChange={(e) => setReplierRole(e.target.value as 'construction' | 'admin')}
                    className="input-base"
                  >
                    <option value="admin">管理员</option>
                    <option value="construction">施工方</option>
                  </select>
                </div>
                <div>
                  <label className="label-base">回复人姓名</label>
                  <input
                    type="text"
                    value={replierName}
                    onChange={(e) => setReplierName(e.target.value)}
                    placeholder="请输入姓名"
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="label-base">回复内容</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value.slice(0, 1000))}
                  placeholder="请输入回复内容..."
                  rows={3}
                  className="input-base resize-none"
                />
                <div className="text-xs text-slate-400 mt-1 text-right">
                  {replyContent.length}/1000
                </div>
              </div>
              <button
                onClick={handleSubmitReply}
                disabled={loading || !replyContent.trim()}
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
                    发送回复
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">更新状态：</span>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as IssueFeedbackStatus)}
              className="input-base !py-2 !text-sm"
            >
              {(['pending', 'processing', 'resolved', 'closed'] as IssueFeedbackStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {ISSUE_STATUS_LABELS[s]}
                  </option>
                )
              )}
            </select>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="处理人（选填）"
              className="input-base !py-2 !text-sm !w-36"
            />
            <button
              onClick={handleStatusChange}
              disabled={newStatus === issue.status}
              className="btn-outline !px-4 !py-2 disabled:opacity-50"
            >
              确认更新
            </button>
          </div>
          <button onClick={onClose} className="btn-ghost">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IssuesAdminPage() {
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [filterStatus, setFilterStatus] = useState<IssueFeedbackStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<IssueFeedbackCategory | 'all'>('all');
  const [viewingIssue, setViewingIssue] = useState<EnrichedIssue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
    closed: 0,
  });

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const [list, statData] = await Promise.all([
        api.getIssueFeedbacks({
          status: filterStatus === 'all' ? undefined : filterStatus,
          category: filterCategory === 'all' ? undefined : filterCategory,
        }),
        api.getIssueStats(),
      ]);
      setIssues(list);
      setStats(statData);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filterStatus, filterCategory]);

  const handleStatusChange = async (status: IssueFeedbackStatus, assignedTo?: string) => {
    if (!viewingIssue) return;
    setSubmitting(true);
    try {
      await api.updateIssueFeedback(viewingIssue.id, { status, assignedTo });
      showToast('状态更新成功', 'success');
      const updated = await api.getIssueFeedback(viewingIssue.id);
      setViewingIssue(updated);
      fetchIssues();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (
    content: string,
    replier: string,
    replierRole: 'construction' | 'admin'
  ) => {
    if (!viewingIssue) return;
    setSubmitting(true);
    try {
      await api.addIssueReply(viewingIssue.id, { content, replier, replierRole });
      showToast('回复发送成功', 'success');
      const updated = await api.getIssueFeedback(viewingIssue.id);
      setViewingIssue(updated);
      fetchIssues();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/proposals" className="inline-flex items-center gap-1.5 hover:text-primary-700 transition-colors">
          <Home className="w-4 h-4" />
          提案广场
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-medium">施工问题反馈</span>
      </nav>

      <div className="card p-6 mb-6 relative overflow-hidden grain-overlay">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-100 to-orange-200 opacity-60" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">施工问题反馈管理</h1>
              {stats.pending > 0 && (
                <span className="badge bg-danger-100 text-danger-700 border-danger-200 animate-pulse">
                  {stats.pending} 条待处理
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              管理业主提交的施工问题反馈，跟踪处理进度，及时回复业主关切
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-center">
              {(['pending', 'processing', 'resolved', 'closed'] as IssueFeedbackStatus[]).map(
                (s) => {
                  const Icon = STATUS_ICON[s];
                  return (
                    <div key={s} className="px-3 py-2 rounded-lg bg-white border border-slate-200">
                      <Icon
                        className={cn(
                          'w-4 h-4 mx-auto mb-1',
                          s === 'pending'
                            ? 'text-yellow-600'
                            : s === 'processing'
                            ? 'text-primary-600'
                            : s === 'resolved'
                            ? 'text-success-600'
                            : 'text-slate-500'
                        )}
                      />
                      <div className="text-lg font-bold text-slate-800">{stats[s]}</div>
                      <div className="text-[10px] text-slate-500">{ISSUE_STATUS_LABELS[s]}</div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
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
                  {opt.key !== 'all' && stats[opt.key as keyof typeof stats] > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-200 text-slate-600">
                      {stats[opt.key as keyof typeof stats]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/70 overflow-x-auto scrollbar-none">
            <span className="inline-flex items-center gap-1.5 px-3 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              分类
            </span>
            {CATEGORY_FILTER_OPTIONS.map((opt) => {
              const active = filterCategory === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFilterCategory(opt.key)}
                  className={cn('tab-btn', active && 'tab-btn-active')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
      ) : issues.length === 0 ? (
        <div className="card p-16 text-center">
          <AlertTriangle className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <div className="text-lg font-semibold text-slate-700">暂无问题反馈</div>
          <div className="text-sm text-slate-500 mt-1">
            {filterStatus !== 'all' || filterCategory !== 'all'
              ? '当前筛选条件下没有问题反馈，尝试查看全部'
              : '目前没有任何施工问题反馈'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const CategoryIcon = CATEGORY_ICON[issue.category];
            const StatusIcon = STATUS_ICON[issue.status];
            return (
              <div
                key={issue.id}
                className={cn(
                  'card p-6 transition-all duration-200 cursor-pointer hover:shadow-card',
                  issue.status === 'pending' && 'border-l-4 border-l-yellow-400',
                  issue.priority === 'urgent' && 'border-l-4 !border-l-red-500'
                )}
                onClick={() => setViewingIssue(issue)}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        ISSUE_CATEGORY_COLORS[issue.category]
                      )}
                    >
                      <CategoryIcon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={cn('badge', ISSUE_STATUS_COLORS[issue.status])}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {ISSUE_STATUS_LABELS[issue.status]}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold',
                            ISSUE_PRIORITY_COLORS[issue.priority]
                          )}
                        >
                          {issue.priority === 'urgent' && <Zap className="w-3 h-3" />}
                          {ISSUE_PRIORITY_LABELS[issue.priority]}
                        </span>
                        {issue.proposal && (
                          <Link
                            to={`/proposal/${issue.proposal.id}/progress`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors"
                          >
                            <Building2 className="w-3 h-3" />
                            {issue.proposal.communityName} {issue.proposal.buildingNumber}
                          </Link>
                        )}
                      </div>

                      <h4 className="font-bold text-lg text-slate-800 mb-2">{issue.title}</h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        {issue.household && (
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {issue.household.unit}单元 {issue.household.floor}层{' '}
                            {issue.household.roomNumber}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(issue.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {issue.replies.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {issue.replies.length} 条回复
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {issue.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingIssue(issue);
                      }}
                      className="btn-primary !px-4 !py-2.5"
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingIssue && (
        <IssueDetailModal
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
          onStatusChange={handleStatusChange}
          onAddReply={handleAddReply}
          loading={submitting}
        />
      )}
    </div>
  );
}
