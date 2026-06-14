import { useState } from 'react';
import { X, Building, User, Calendar, ArrowUpToLine, FileText, Ruler } from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';

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

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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

          <div>
            <label className="label-base">电梯方案描述</label>
            <textarea
              className="input-base min-h-[80px] resize-none"
              value={form.elevatorPlan}
              onChange={(e) => update('elevatorPlan', e.target.value)}
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
