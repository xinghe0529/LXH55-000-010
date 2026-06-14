import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  UserCheck,
  Building2,
  Calculator,
  Scale,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ShieldAlert,
  Send,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Minus as MinusIcon,
  Info,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  VOTE_LABELS,
  APPEAL_STATUS_LABELS,
  APPEAL_STATUS_COLORS,
  type Proposal,
  type Household,
  type FeeEstimateItem,
  type VoteResult,
  type VoteRecord,
  type VoteOption,
  type Appeal,
} from '../../shared/types';
import { formatCurrency, calcFloorCoefficient } from '../../shared/calculator';
import { cn } from '../lib/utils';

export default function VotePanelPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [feeEstimate, setFeeEstimate] = useState<{
    proposalId: string;
    estimatedTotalCost: number;
    totalWeightFactor: number;
    items: FeeEstimateItem[];
  } | null>(null);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [appeals, setAppeals] = useState<Appeal[]>([]);

  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [myVote, setMyVote] = useState<VoteRecord | null>(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [selectedVoteOption, setSelectedVoteOption] = useState<VoteOption | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [p, h, f, v, a] = await Promise.all([
          api.getProposal(id),
          api.getHouseholds(id),
          api.getFeeEstimate(id),
          api.getVoteResult(id),
          api.getAppeals(id),
        ]);
        if (!alive) return;
        setProposal(p);
        setHouseholds(h);
        setFeeEstimate(f);
        setVoteResult(v);
        setAppeals(a);
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

  const units = useMemo(() => {
    const set = new Set(households.map((h) => h.unit));
    return Array.from(set).sort();
  }, [households]);

  const floors = useMemo(() => {
    if (!selectedUnit) return [];
    const set = new Set(
      households.filter((h) => h.unit === selectedUnit).map((h) => String(h.floor))
    );
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [households, selectedUnit]);

  const rooms = useMemo(() => {
    if (!selectedUnit || !selectedFloor) return [];
    return households
      .filter((h) => h.unit === selectedUnit && String(h.floor) === selectedFloor)
      .map((h) => h.roomNumber)
      .sort();
  }, [households, selectedUnit, selectedFloor]);

  useEffect(() => {
    if (selectedUnit && selectedFloor && selectedRoom) {
      const h = households.find(
        (hh) =>
          hh.unit === selectedUnit &&
          String(hh.floor) === selectedFloor &&
          hh.roomNumber === selectedRoom
      );
      setSelectedHousehold(h ?? null);
    } else {
      setSelectedHousehold(null);
    }
  }, [selectedUnit, selectedFloor, selectedRoom, households]);

  useEffect(() => {
    if (selectedHousehold && id) {
      api
        .getMyVote(id, selectedHousehold.id)
        .then((v) => setMyVote(v))
        .catch(() => setMyVote(null));
    } else {
      setMyVote(null);
    }
  }, [selectedHousehold, id]);

  useEffect(() => {
    setSelectedVoteOption(null);
  }, [selectedHousehold]);

  const totals = useMemo(() => {
    if (!feeEstimate) return null;
    return feeEstimate.items.reduce(
      (acc, it) => ({
        area: acc.area + it.area,
        weightFactor: acc.weightFactor + it.weightFactor,
        estimatedFee: acc.estimatedFee + it.estimatedFee,
        percentage: acc.percentage + it.percentage,
      }),
      { area: 0, weightFactor: 0, estimatedFee: 0, percentage: 0 }
    );
  }, [feeEstimate]);

  const handleSubmitVote = async () => {
    if (!selectedVoteOption || !selectedHousehold || !id || proposal?.status !== 'voting') return;
    setVoteLoading(true);
    try {
      const record = await api.submitVote(id, selectedHousehold.id, selectedVoteOption);
      setMyVote(record);
      const vr = await api.getVoteResult(id);
      setVoteResult(vr);
      showToast('投票成功', 'success');
      setSelectedVoteOption(null);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!appealReason.trim() || !selectedHousehold || !id) {
      showToast('请先选择住户并填写申诉理由', 'error');
      return;
    }
    setAppealLoading(true);
    try {
      const newAppeal = await api.submitAppeal({
        proposalId: id,
        householdId: selectedHousehold.id,
        reason: appealReason.trim(),
      });
      setAppeals((prev) => [newAppeal, ...prev]);
      setAppealReason('');
      showToast('申诉已提交', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setAppealLoading(false);
    }
  };

  const votePercentages = useMemo(() => {
    if (!voteResult) return { agree: 0, disagree: 0, abstain: 0 };
    const total = voteResult.agreeCount + voteResult.disagreeCount + voteResult.abstainCount;
    if (total === 0) return { agree: 0, disagree: 0, abstain: 0 };
    return {
      agree: (voteResult.agreeCount / total) * 100,
      disagree: (voteResult.disagreeCount / total) * 100,
      abstain: (voteResult.abstainCount / total) * 100,
    };
  }, [voteResult]);

  const isVoting = proposal?.status === 'voting';

  if (loading) {
    return (
      <div className="container py-8 animate-fade-in">
        <div className="animate-pulse space-y-6">
          <div className="h-5 w-64 bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="card p-6 space-y-4">
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-10 w-full bg-slate-200 rounded-lg" />
              <div className="h-10 w-full bg-slate-200 rounded-lg" />
              <div className="h-10 w-full bg-slate-200 rounded-lg" />
            </div>
            <div className="lg:col-span-3 card p-6">
              <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 w-full bg-slate-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/proposals" className="inline-flex items-center gap-1.5 hover:text-primary-700 transition-colors">
          <Home className="w-4 h-4" />
          提案广场
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-medium">
          {proposal?.communityName} {proposal?.buildingNumber} · 投票面板
        </span>
      </nav>

      <div className="card p-6 mb-6 relative overflow-hidden grain-overlay">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 opacity-60" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">
                {proposal?.communityName}
                <span className="text-primary-700 ml-2">{proposal?.buildingNumber}</span>
              </h1>
              <span className={cn('badge', STATUS_COLORS[proposal?.status ?? 'voting'])}>
                {STATUS_LABELS[proposal?.status ?? 'voting']}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-500 flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {proposal?.totalFloors}层 · {proposal?.unitsCount}单元 · {proposal?.totalHouseholds}户
              </span>
              <span className="inline-flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                总造价 {formatCurrency(proposal?.estimatedTotalCost ?? 0)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {proposal?.votingStartDate} ~ {proposal?.votingEndDate}
              </span>
            </div>
          </div>
          <div className="text-sm">
            <div className="text-slate-500">发起人</div>
            <div className="font-semibold text-slate-800">{proposal?.initiator}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="card p-6 h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5 text-primary-700" />
            </div>
            <h2 className="section-title text-lg">身份选择</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-base">单元</label>
              <div className="relative">
                <select
                  value={selectedUnit}
                  onChange={(e) => { setSelectedUnit(e.target.value); setSelectedFloor(''); setSelectedRoom(''); }}
                  className="input-base appearance-none pr-10"
                >
                  <option value="">请选择单元</option>
                  {units.map((u) => (
                    <option key={u} value={u}>{u}单元</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label-base">楼层</label>
              <div className="relative">
                <select
                  value={selectedFloor}
                  onChange={(e) => { setSelectedFloor(e.target.value); setSelectedRoom(''); }}
                  disabled={!selectedUnit}
                  className="input-base appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">请选择楼层</option>
                  {floors.map((f) => (
                    <option key={f} value={f}>{f}层</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label-base">房号</label>
              <div className="relative">
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  disabled={!selectedFloor}
                  className="input-base appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">请选择房号</option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {selectedHousehold && (
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200">
              <div className="text-xs font-medium text-primary-600 mb-1.5">当前住户</div>
              <div className="font-bold text-primary-900 text-lg">
                {selectedHousehold.unit}单元 {selectedHousehold.floor}层 {selectedHousehold.roomNumber}
              </div>
              <div className="mt-2 text-xs text-primary-700 space-y-0.5">
                <div>建筑面积：{selectedHousehold.area} ㎡</div>
                <div>楼层系数：{calcFloorCoefficient(selectedHousehold.floor).toFixed(2)}</div>
              </div>
            </div>
          )}

          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-bold text-slate-800">楼层系数说明</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-16 flex-shrink-0">1-2层</span>
                <span className="text-slate-700 font-medium">系数 0.05</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-16 flex-shrink-0">3层</span>
                <span className="text-slate-700 font-medium">系数 1.00</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-16 flex-shrink-0">4层及以上</span>
                <span className="text-slate-700 font-medium">每层 +0.1</span>
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  公式：楼层系数 = floor &le; 2 ? 0.05 : 1.0 + (floor-3) &times; 0.1
                  <br />
                  权重因子 = 楼层系数 &times; 建筑面积
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-5">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
                  <Calculator className="w-4.5 h-4.5 text-accent-700" />
                </div>
                <h2 className="section-title text-lg">费用分摊估算</h2>
              </div>
              <div className="text-sm text-slate-500">
                总权重因子：<span className="font-semibold text-slate-800">{feeEstimate?.totalWeightFactor.toFixed(2)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="text-left px-5 py-3.5">楼层</th>
                    <th className="text-left px-5 py-3.5">房号</th>
                    <th className="text-right px-5 py-3.5">面积(㎡)</th>
                    <th className="text-right px-5 py-3.5">楼层系数</th>
                    <th className="text-right px-5 py-3.5">权重因子</th>
                    <th className="text-right px-5 py-3.5">分摊金额</th>
                    <th className="text-right px-5 py-3.5">占比%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeEstimate?.items.map((item) => {
                    const isSelected = selectedHousehold?.id === item.householdId;
                    return (
                      <tr
                        key={item.householdId}
                        className={cn(
                          'text-sm transition-colors duration-200',
                          isSelected
                            ? 'bg-primary-50/80 border-l-4 border-l-primary-500'
                            : 'hover:bg-slate-50/50'
                        )}
                      >
                        <td className={cn('px-5 py-3', isSelected && 'font-semibold text-primary-900')}>
                          {item.floor}层
                        </td>
                        <td className={cn('px-5 py-3', isSelected && 'font-semibold text-primary-900')}>
                          {item.roomNumber}
                        </td>
                        <td className={cn('px-5 py-3 text-right tabular-nums', isSelected && 'font-semibold text-primary-900')}>
                          {item.area}
                        </td>
                        <td className={cn('px-5 py-3 text-right tabular-nums', isSelected && 'font-semibold text-primary-900')}>
                          {item.floorCoefficient.toFixed(2)}
                        </td>
                        <td className={cn('px-5 py-3 text-right tabular-nums', isSelected && 'font-semibold text-primary-900')}>
                          {item.weightFactor.toFixed(2)}
                        </td>
                        <td className={cn('px-5 py-3 text-right tabular-nums font-medium', isSelected && 'text-primary-900')}>
                          {formatCurrency(item.estimatedFee)}
                        </td>
                        <td className={cn('px-5 py-3 text-right tabular-nums', isSelected && 'font-semibold text-primary-900')}>
                          {item.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                  {totals && (
                    <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                      <td className="px-5 py-3.5 text-sm">合计</td>
                      <td className="px-5 py-3.5 text-sm">-</td>
                      <td className="px-5 py-3.5 text-sm text-right tabular-nums">{totals.area}</td>
                      <td className="px-5 py-3.5 text-sm text-right">-</td>
                      <td className="px-5 py-3.5 text-sm text-right tabular-nums">{totals.weightFactor.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm text-right tabular-nums text-accent-700">
                        {formatCurrency(totals.estimatedFee)}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right tabular-nums">{totals.percentage.toFixed(1)}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <ShieldAlert className="w-4.5 h-4.5 text-primary-700" />
              </div>
              <h2 className="section-title text-lg">投票操作</h2>
            </div>

            {!selectedHousehold ? (
              <div className="text-center py-12 text-slate-500">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>请先在左侧选择您的住户身份</p>
              </div>
            ) : myVote ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center'
                      )}
                      style={{
                        background: myVote.option === 'agree'
                          ? 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
                          : myVote.option === 'disagree'
                          ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
                          : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)'
                      }}
                    >
                      {myVote.option === 'agree' && <CheckCircle2 className="w-8 h-8 text-success-600" />}
                      {myVote.option === 'disagree' && <AlertCircle className="w-8 h-8 text-danger-600" />}
                      {myVote.option === 'abstain' && <MinusIcon className="w-8 h-8 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={cn(
                            'badge',
                            myVote.option === 'agree' &&
                              'bg-success-100 text-success-700 border-success-200',
                            myVote.option === 'disagree' &&
                              'bg-danger-100 text-danger-700 border-danger-200',
                            myVote.option === 'abstain' &&
                              'bg-slate-100 text-slate-700 border-slate-300'
                          )}
                        >
                          {VOTE_LABELS[myVote.option]}
                        </span>
                        <span className="text-xs text-slate-500">投票权重：{myVote.weight.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        投票时间：{myVote.votedAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 bg-white px-4 py-3 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">已完成投票</div>
                    <div className="font-semibold text-slate-800">感谢您的参与</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <button
                    onClick={() => isVoting && setSelectedVoteOption('agree')}
                    disabled={!isVoting}
                    className={cn(
                      'relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group',
                      selectedVoteOption === 'agree'
                        ? 'border-success-500 bg-gradient-to-br from-success-50 to-success-100 shadow-lg -translate-y-0.5'
                        : isVoting
                        ? 'border-slate-200 bg-white hover:border-success-300 hover:bg-success-50/50 hover:-translate-y-0.5'
                        : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                          selectedVoteOption === 'agree'
                            ? 'bg-gradient-to-br from-success-500 to-success-600 text-white'
                            : 'bg-success-100 text-success-600 group-hover:bg-success-200'
                        )}
                      >
                        <ThumbsUp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">同意</div>
                        <div className="text-xs text-slate-500">支持加装电梯</div>
                      </div>
                    </div>
                    {selectedVoteOption === 'agree' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-success-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <p className="text-sm text-slate-600 mt-2">
                      认可费用分摊方案，同意推进项目实施。
                    </p>
                  </button>

                  <button
                    onClick={() => isVoting && setSelectedVoteOption('disagree')}
                    disabled={!isVoting}
                    className={cn(
                      'relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group',
                      selectedVoteOption === 'disagree'
                        ? 'border-danger-500 bg-gradient-to-br from-danger-50 to-danger-100 shadow-lg -translate-y-0.5'
                        : isVoting
                        ? 'border-slate-200 bg-white hover:border-danger-300 hover:bg-danger-50/50 hover:-translate-y-0.5'
                        : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                          selectedVoteOption === 'disagree'
                            ? 'bg-gradient-to-br from-danger-500 to-danger-600 text-white'
                            : 'bg-danger-100 text-danger-600 group-hover:bg-danger-200'
                        )}
                      >
                        <ThumbsDown className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">反对</div>
                        <div className="text-xs text-slate-500">不支持加装</div>
                      </div>
                    </div>
                    {selectedVoteOption === 'disagree' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-danger-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <p className="text-sm text-slate-600 mt-2">
                      对方案有异议，或不参与本项目。
                    </p>
                  </button>

                  <button
                    onClick={() => isVoting && setSelectedVoteOption('abstain')}
                    disabled={!isVoting}
                    className={cn(
                      'relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group',
                      selectedVoteOption === 'abstain'
                        ? 'border-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg -translate-y-0.5'
                        : isVoting
                        ? 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-0.5'
                        : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                          selectedVoteOption === 'abstain'
                            ? 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        )}
                      >
                        <Minus className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-slate-900">弃权</div>
                        <div className="text-xs text-slate-500">暂不表态</div>
                      </div>
                    </div>
                    {selectedVoteOption === 'abstain' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center">
                        <Minus className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <p className="text-sm text-slate-600 mt-2">
                      保留意见，不参与本次表决。
                    </p>
                  </button>
                </div>

                {!isVoting && (
                  <div className="text-center text-sm text-slate-500 flex items-center justify-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4" />
                    当前状态为「{STATUS_LABELS[proposal?.status ?? 'voting']}」，不可投票
                  </div>
                )}

                {selectedVoteOption && isVoting && (
                  <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
                    <div>
                      <div className="text-sm font-semibold text-primary-900">
                        确认您的投票选择
                      </div>
                      <div className="text-xs text-primary-700 mt-0.5">
                        您选择了：
                        <span className="font-semibold">{VOTE_LABELS[selectedVoteOption]}</span>
                        ，提交后不可修改
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitVote}
                      disabled={voteLoading}
                      className="btn-primary !px-8 !py-3"
                    >
                      {voteLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          确认提交投票
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-success-100 to-success-200 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5 text-success-700" />
              </div>
              <h2 className="section-title text-lg">投票结果公示</h2>
            </div>

            <div className="mb-6">
              <div className="h-6 rounded-full overflow-hidden bg-slate-100 flex">
                <div
                  className="h-full bg-gradient-to-r from-success-400 to-success-500 transition-all duration-700"
                  style={{ width: `${votePercentages.agree}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-danger-400 to-danger-500 transition-all duration-700"
                  style={{ width: `${votePercentages.disagree}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-slate-300 to-slate-400 transition-all duration-700"
                  style={{ width: `${votePercentages.abstain}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-success-400 to-success-500" />
                  <span className="text-slate-600">同意</span>
                  <span className="ml-auto font-bold tabular-nums text-success-700">
                    {votePercentages.agree.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-danger-400 to-danger-500" />
                  <span className="text-slate-600">反对</span>
                  <span className="ml-auto font-bold tabular-nums text-danger-700">
                    {votePercentages.disagree.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-300 to-slate-400" />
                  <span className="text-slate-600">弃权</span>
                  <span className="ml-auto font-bold tabular-nums text-slate-600">
                    {votePercentages.abstain.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-gradient-to-br from-slate-50 border border-slate-200">
              <div className="text-center sm:text-left">
                <div className="text-xs font-semibold text-slate-500 mb-2">加权同意率</div>
                <div className="flex items-baseline gap-2 flex-wrap justify-center sm:justify-start">
                  <span
                    className="font-display font-black tabular-nums"
                    style={{
                      fontSize: '3.5rem',
                      lineHeight: 1,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {voteResult?.weightedAgreeRate?.toFixed(1) ?? 0}
                    <span className="text-2xl">%</span>
                  </span>
                  <span
                    className={cn(
                      'badge mt-2',
                      voteResult?.passed
                        ? 'bg-success-100 text-success-700 border-success-200'
                        : 'bg-danger-100 text-danger-700 border-danger-200'
                    )}
                  >
                    {voteResult?.passed ? '✓ 已通过' : '✗ 未通过'}
                  </span>
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-4 justify-center sm:justify-start flex-wrap">
                  <span>投票率：{voteResult?.votingRate?.toFixed(1) ?? 0}%</span>
                  <span>已投票：{voteResult?.votedCount ?? 0}/{voteResult?.totalHouseholds ?? 0}户</span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-sm">
                  <div className="flex items-start gap-2 text-slate-600">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-500" />
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">通过规则</div>
                      <div className="text-xs leading-relaxed">
                        加权同意率 ≥ 2/3（66.67%）
                        <br />
                        且投票率 ≥ 50%
                        <br />
                        <span className="text-slate-500">同时满足方可通过</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                <Flag className="w-4.5 h-4.5 text-yellow-700" />
              </div>
              <h2 className="section-title text-lg">异议申诉</h2>
            </div>

            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-yellow-50/50 border border-yellow-200">
              <label className="label-base !text-yellow-900">申诉理由</label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value.slice(0, 500))}
                placeholder={selectedHousehold ? '请详细描述您的异议理由...' : '请先选择住户身份'}
                rows={4}
                disabled={!selectedHousehold}
                className="input-base resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-yellow-800/70">
                  {appealReason.length}/500
                </div>
                <button
                  onClick={handleSubmitAppeal}
                  disabled={appealLoading || !selectedHousehold || !appealReason.trim()}
                  className="btn-accent !px-6 !py-2 disabled:opacity-50"
                >
                  {appealLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      提交申诉
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span>已有申诉</span>
                <span className="badge bg-slate-100 text-slate-600 border-slate-200">{appeals.length}</span>
              </div>
              {appeals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  暂无申诉记录
                </div>
              ) : (
                <div className="space-y-3">
                  {appeals.map((a) => {
                    const hh = households.find((h) => h.id === a.householdId);
                    const isResolved = a.status === 'resolved';
                    const isRejected = a.status === 'rejected';
                    const isReviewed = a.status === 'reviewed';
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          'p-4 rounded-xl border bg-white hover:border-slate-300 transition-colors',
                          a.status === 'pending' && 'border-yellow-300 border-l-4 border-l-yellow-400',
                          isReviewed && 'border-primary-200 border-l-4 border-l-primary-400',
                          isResolved && 'border-success-200 border-l-4 border-l-success-400',
                          isRejected && 'border-danger-200 border-l-4 border-l-danger-400'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {hh ? `${hh.unit}${hh.floor}${hh.roomNumber.slice(0, 1)}` : '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800">
                                {hh ? `${hh.unit}单元${hh.floor}层${hh.roomNumber}` : '未知住户'}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {a.createdAt}
                              </div>
                            </div>
                          </div>
                          <span className={cn('badge text-[11px]', APPEAL_STATUS_COLORS[a.status])}>
                            {APPEAL_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2 pl-10">{a.reason}</p>
                        {a.reply && (
                          <div className={cn(
                            'mt-3 ml-10 p-3 rounded-lg border text-sm',
                            isResolved && 'bg-success-50/50 border-success-200',
                            isRejected && 'bg-danger-50/50 border-danger-200',
                            isReviewed && 'bg-primary-50/50 border-primary-200',
                            a.status === 'pending' && 'bg-slate-50 border-slate-200'
                          )}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-primary-500" />
                              <span className="font-semibold text-slate-700 text-xs">官方回复</span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">{a.reply}</p>
                            {(a.reviewer || a.reviewedAt) && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 flex items-center gap-3">
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
