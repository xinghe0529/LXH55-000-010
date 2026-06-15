import { useState, useEffect } from 'react';
import { X, Building, User, Calendar, ArrowUpToLine, FileText, Ruler, Package, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import type { ElevatorPlan } from '../../shared/types';
import { formatCurrency } from '../../shared/calculator';
import { cn } from '../lib/utils';

export default function NewProposalModal() {
  const open = useUIStore((s) => s.newProposalModal);
  const close = () => useUIStore.getState().setNewProposalModal(false);
  const showToast = useUIStore((s) => s.showToast);

  const [form, setForm] = useState({
    communityName: '',
    buildingNumber: '',
    totalFloors: 6,
    unitsCount: 2,
    householdsPerUnit: 2,
    estimatedTotalCost: 500000,
    elevatorPlan: '钢结构外挂电梯 800kg/10人 1.0m/s',
    estimatedDuration: 120,
    initiator: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<Array<ElevatorPlan & { brandName: string }>>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) {
      setPlansLoading(true);
      api.getElevatorPlans({ activeOnly: true })
        .then((list) => {
          setPlans(list);
        })
        .catch((e) => {
          showToast((e as Error).message, 'error');
        })
        .finally(() => {
          setPlansLoading(false);
        });
    }
  }, [open, showToast]);

  const handleSelectPlan = (plan: ElevatorPlan & { brandName: string }) => {
    setSelectedPlanId(plan.id);
    update('estimatedTotalCost', plan.basePrice);
    update('estimatedDuration', plan.constructionDays);
    update('elevatorPlan', `${plan.brandName} ${plan.name} ${plan.loadCapacity}kg/${plan.passengerCount}人 ${plan.speed}m/s`);
    setShowPlanPicker(false);
    showToast(`已选择方案：${plan.brandName} ${plan.name}，费用和工期已自动填充`, 'success');
  };

  const submit = async () => {
    if (!form.communityName || !form.buildingNumber || !form.initiator) {
      showToast('请填写完整必填字段', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const p = await api.createProposal(form);
      showToast(`提案创建成功：${p.communityName} ${p.buildingNumber}`, 'success');
      setForm({
        communityName: '',
        buildingNumber: '',
        totalFloors: 6,
        unitsCount: 2,
        householdsPerUnit: 2,
        estimatedTotalCost: 500000,
        elevatorPlan: '钢结构外挂电梯 800kg/10人 1.0m/s',
        estimatedDuration: 120,
        initiator: '',
      });
      setSelectedPlanId('');
      setShowPlanPicker(false);
      const list = await api.getProposals();
      useUIStore.getState().setProposals(list);
      close();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-5 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
          <div>
            <div className="text-xl font-display font-bold">发起加装电梯提案</div>
            <div className="text-xs text-primary-100 mt-0.5">填写楼栋基本信息，系统将自动生成分户清单</div>
          </div>
          <button onClick={close} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-7 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-base">
                <Building className="w-4 h-4 inline mr-1 text-primary-500" />
                小区名称 *
              </label>
              <input
                className="input-base"
                placeholder="如：阳光花园小区"
                value={form.communityName}
                onChange={(e) => update('communityName', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">
                <ArrowUpToLine className="w-4 h-4 inline mr-1 text-primary-500" />
                楼栋号 *
              </label>
              <input
                className="input-base"
                placeholder="如：3号楼"
                value={form.buildingNumber}
                onChange={(e) => update('buildingNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">
                <Ruler className="w-4 h-4 inline mr-1 text-primary-500" />
                总楼层数
              </label>
              <input
                type="number"
                min={3}
                max={20}
                className="input-base"
                value={form.totalFloors}
                onChange={(e) => update('totalFloors', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">单元数</label>
              <input
                type="number"
                min={1}
                max={6}
                className="input-base"
                value={form.unitsCount}
                onChange={(e) => update('unitsCount', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">每层户数</label>
              <input
                type="number"
                min={1}
                max={6}
                className="input-base"
                value={form.householdsPerUnit}
                onChange={(e) => update('householdsPerUnit', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">预计总户数（自动）</label>
              <input
                className="input-base bg-slate-50"
                disabled
                value={form.totalFloors * form.unitsCount * form.householdsPerUnit + ' 户'}
              />
            </div>
            <div>
              <label className="label-base">
                <FileText className="w-4 h-4 inline mr-1 text-primary-500" />
                工程预估总价（元）
              </label>
              <input
                type="number"
                className="input-base"
                value={form.estimatedTotalCost}
                onChange={(e) => update('estimatedTotalCost', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">
                <Calendar className="w-4 h-4 inline mr-1 text-primary-500" />
                预估工期（天）
              </label>
              <input
                type="number"
                className="input-base"
                value={form.estimatedDuration}
                onChange={(e) => update('estimatedDuration', +e.target.value)}
              />
            </div>
          </div>

          <div className="relative">
            <label className="label-base">
              <Package className="w-4 h-4 inline mr-1 text-accent-500" />
              选择电梯方案
              <span className="text-xs text-slate-400 ml-2">从配置库选择可自动填充费用和工期</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPlanPicker(!showPlanPicker)}
              className={cn(
                'w-full input-base text-left flex items-center justify-between',
                selectedPlanId ? 'text-slate-900' : 'text-slate-400'
              )}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" />
                {selectedPlanId
                  ? plans.find((p) => p.id === selectedPlanId)?.name
                  : '点击选择电梯方案...'}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showPlanPicker && 'rotate-180')} />
            </button>

            {showPlanPicker && (
              <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto animate-slide-up">
                {plansLoading ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : plans.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    暂无可用方案
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {plans.map((plan) => {
                      const selected = selectedPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => handleSelectPlan(plan)}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-all duration-200',
                            selected
                              ? 'bg-accent-50 border-2 border-accent-400'
                              : 'hover:bg-slate-50 border-2 border-transparent'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 text-sm truncate">{plan.name}</span>
                                <span className="badge bg-primary-100 text-primary-700 border-primary-200 text-[10px] flex-shrink-0">
                                  {plan.brandName}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mb-2">
                                {plan.loadCapacity}kg / {plan.passengerCount}人 · {plan.speed}m/s
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-accent-600 font-semibold">
                                  {formatCurrency(plan.basePrice)}
                                </span>
                                <span className="text-primary-600">{plan.constructionDays}天</span>
                                <span className="text-success-600">{plan.warrantyYears}年质保</span>
                              </div>
                            </div>
                            {selected && (
                              <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="label-base">电梯方案描述</label>
            <textarea
              className="input-base min-h-[80px] resize-none"
              value={form.elevatorPlan}
              onChange={(e) => update('elevatorPlan', e.target.value)}
              placeholder="可手动编辑方案描述，或从上方选择方案自动填充"
            />
          </div>

          <div>
            <label className="label-base">
              <User className="w-4 h-4 inline mr-1 text-primary-500" />
              发起方 / 联系人 *
            </label>
            <input
              className="input-base"
              placeholder="如：阳光花园业委会（张主任）"
              value={form.initiator}
              onChange={(e) => update('initiator', e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 text-xs text-primary-700 leading-relaxed">
            <strong className="font-semibold">说明：</strong>
            系统将自动生成各层住户清单，并按「1-2层系数0.05、3层起每层+0.1」的楼层系数乘以建筑面积，计算每户分摊金额。投票将采用权重投票方式，加权同意率≥2/3且投票率≥50%视为通过。
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-7 py-4 bg-slate-50 border-t border-slate-200">
          <button className="btn-outline" onClick={close}>取消</button>
          <button className="btn-primary" disabled={submitting} onClick={submit}>
            {submitting ? '提交中...' : '确认发起提案'}
          </button>
        </div>
      </div>
    </div>
  );
}
