import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  ChevronDown,
  Home,
  ChevronRight,
  Package,
  Clock,
  ShieldCheck,
  Gauge,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import {
  STRUCTURE_TYPE_LABELS,
  DRIVE_TYPE_LABELS,
  MACHINE_ROOM_TYPE_LABELS,
  type ElevatorBrand,
  type ElevatorPlan,
} from '../../shared/types';
import { formatCurrency } from '../../shared/calculator';
import { cn } from '../lib/utils';

type TabType = 'brands' | 'plans';

function BrandModal({
  brand,
  onClose,
  onSubmit,
  loading,
}: {
  brand: ElevatorBrand | null;
  onClose: () => void;
  onSubmit: (data: Partial<ElevatorBrand>) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: brand?.name || '',
    country: brand?.country || '',
    description: brand?.description || '',
    logoUrl: brand?.logoUrl || '',
    isActive: brand?.isActive ?? true,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-slide-up">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  {brand ? '编辑电梯品牌' : '新增电梯品牌'}
                </h3>
                <p className="text-xs text-slate-500">维护可选电梯品牌列表</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">品牌名称 *</label>
              <input
                className="input-base"
                placeholder="如：三菱电梯"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">所属国家 *</label>
              <input
                className="input-base"
                placeholder="如：日本"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-base">品牌Logo URL</label>
            <input
              className="input-base"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(e) => update('logoUrl', e.target.value)}
            />
          </div>

          <div>
            <label className="label-base">品牌描述</label>
            <textarea
              className="input-base min-h-[80px] resize-none"
              placeholder="请输入品牌简介..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">启用状态</div>
              <div className="text-xs text-slate-500 mt-0.5">启用后可在提案创建时选择</div>
            </div>
            <button
              onClick={() => update('isActive', !form.isActive)}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
                form.isActive
                  ? 'bg-success-100 text-success-600 hover:bg-success-200'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              )}
            >
              {form.isActive ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline !px-5 !py-2.5">
            取消
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.name.trim() || !form.country.trim()}
            className="btn-primary !px-5 !py-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanModal({
  plan,
  brands,
  onClose,
  onSubmit,
  loading,
}: {
  plan: (ElevatorPlan & { brandName: string }) | null;
  brands: ElevatorBrand[];
  onClose: () => void;
  onSubmit: (data: Partial<ElevatorPlan>) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    brandId: plan?.brandId || (brands[0]?.id ?? ''),
    name: plan?.name || '',
    loadCapacity: plan?.loadCapacity || 630,
    passengerCount: plan?.passengerCount || 8,
    speed: plan?.speed || 1.0,
    structureType: plan?.structureType || 'steel',
    driveType: plan?.driveType || 'traction',
    machineRoomType: plan?.machineRoomType || 'small',
    basePrice: plan?.basePrice || 400000,
    constructionDays: plan?.constructionDays || 120,
    warrantyYears: plan?.warrantyYears || 2,
    description: plan?.description || '',
    features: plan?.features?.join('\n') || '',
    isActive: plan?.isActive ?? true,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const features = form.features
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f);
    onSubmit({
      ...form,
      features,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl animate-slide-up">
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent-700" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  {plan ? '编辑电梯方案' : '新增电梯方案'}
                </h3>
                <p className="text-xs text-slate-500">配置电梯报价方案参数</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">所属品牌 *</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-10"
                  value={form.brandId}
                  onChange={(e) => update('brandId', e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label-base">方案名称 *</label>
              <input
                className="input-base"
                placeholder="如：标准型钢结构外挂电梯"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-base">载重(kg) *</label>
              <input
                type="number"
                min={200}
                max={2000}
                step={50}
                className="input-base"
                value={form.loadCapacity}
                onChange={(e) => update('loadCapacity', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">载客量(人) *</label>
              <input
                type="number"
                min={2}
                max={20}
                className="input-base"
                value={form.passengerCount}
                onChange={(e) => update('passengerCount', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">速度(m/s) *</label>
              <input
                type="number"
                min={0.1}
                max={3}
                step={0.05}
                className="input-base"
                value={form.speed}
                onChange={(e) => update('speed', +e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-base">井道结构 *</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-10"
                  value={form.structureType}
                  onChange={(e) => update('structureType', e.target.value as ElevatorPlan['structureType'])}
                >
                  {Object.entries(STRUCTURE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label-base">驱动方式 *</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-10"
                  value={form.driveType}
                  onChange={(e) => update('driveType', e.target.value as ElevatorPlan['driveType'])}
                >
                  {Object.entries(DRIVE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label-base">机房类型 *</label>
              <div className="relative">
                <select
                  className="input-base appearance-none pr-10"
                  value={form.machineRoomType}
                  onChange={(e) => update('machineRoomType', e.target.value as ElevatorPlan['machineRoomType'])}
                >
                  {Object.entries(MACHINE_ROOM_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-base">
                <Zap className="w-3.5 h-3.5 inline mr-1 text-accent-500" />
                基础报价(元) *
              </label>
              <input
                type="number"
                min={100000}
                step={10000}
                className="input-base"
                value={form.basePrice}
                onChange={(e) => update('basePrice', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-primary-500" />
                施工周期(天) *
              </label>
              <input
                type="number"
                min={30}
                max={365}
                className="input-base"
                value={form.constructionDays}
                onChange={(e) => update('constructionDays', +e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-success-500" />
                质保年限(年) *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="input-base"
                value={form.warrantyYears}
                onChange={(e) => update('warrantyYears', +e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label-base">方案描述</label>
            <textarea
              className="input-base min-h-[60px] resize-none"
              placeholder="请输入方案描述..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div>
            <label className="label-base">功能特点</label>
            <textarea
              className="input-base min-h-[100px] resize-none"
              placeholder="每行一个功能特点，如：&#10;曳引式驱动&#10;小机房设计&#10;钢结构井道"
              value={form.features}
              onChange={(e) => update('features', e.target.value)}
            />
            <div className="text-xs text-slate-400 mt-1">每行一个功能特点</div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">启用状态</div>
              <div className="text-xs text-slate-500 mt-0.5">启用后可在提案创建时选择</div>
            </div>
            <button
              onClick={() => update('isActive', !form.isActive)}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
                form.isActive
                  ? 'bg-success-100 text-success-600 hover:bg-success-200'
                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              )}
            >
              {form.isActive ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline !px-5 !py-2.5">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !form.name.trim() ||
              !form.brandId ||
              form.loadCapacity <= 0 ||
              form.passengerCount <= 0 ||
              form.speed <= 0 ||
              form.basePrice <= 0 ||
              form.constructionDays <= 0 ||
              form.warrantyYears <= 0
            }
            className="btn-primary !px-5 !py-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ElevatorConfigPage() {
  const showToast = useUIStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState<TabType>('brands');
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<ElevatorBrand[]>([]);
  const [plans, setPlans] = useState<Array<ElevatorPlan & { brandName: string }>>([]);
  const [filterBrandId, setFilterBrandId] = useState<string>('');

  const [editingBrand, setEditingBrand] = useState<ElevatorBrand | null>(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);

  const [editingPlan, setEditingPlan] = useState<(ElevatorPlan & { brandName: string }) | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [brandsList, plansList] = await Promise.all([
          api.getElevatorBrands(),
          api.getElevatorPlans(),
        ]);
        if (!alive) return;
        setBrands(brandsList);
        setPlans(plansList);
      } catch (e) {
        if (alive) showToast((e as Error).message, 'error');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (activeTab !== 'plans') return;
    let alive = true;
    api.getElevatorPlans({
      brandId: filterBrandId || undefined,
    })
      .then((list) => {
        if (alive) setPlans(list);
      })
      .catch((e) => {
        if (alive) showToast((e as Error).message, 'error');
      });
    return () => {
      alive = false;
    };
  }, [activeTab, filterBrandId, showToast]);

  const handleBrandSubmit = async (data: Partial<ElevatorBrand>) => {
    setBrandLoading(true);
    try {
      if (editingBrand) {
        await api.updateElevatorBrand(editingBrand.id, data);
        showToast('品牌更新成功', 'success');
      } else {
        await api.createElevatorBrand(data);
        showToast('品牌创建成功', 'success');
      }
      setShowBrandModal(false);
      setEditingBrand(null);
      fetchBrands();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setBrandLoading(false);
    }
  };

  const handleBrandDelete = async (id: string) => {
    if (!confirm('确定要删除该品牌吗？删除后不可恢复。')) return;
    try {
      await api.deleteElevatorBrand(id);
      showToast('品牌删除成功', 'success');
      fetchBrands();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleBrandToggle = async (brand: ElevatorBrand) => {
    try {
      await api.updateElevatorBrand(brand.id, { isActive: !brand.isActive });
      showToast(`品牌已${brand.isActive ? '停用' : '启用'}`, 'success');
      fetchBrands();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handlePlanSubmit = async (data: Partial<ElevatorPlan>) => {
    setPlanLoading(true);
    try {
      if (editingPlan) {
        await api.updateElevatorPlan(editingPlan.id, data);
        showToast('方案更新成功', 'success');
      } else {
        await api.createElevatorPlan(data);
        showToast('方案创建成功', 'success');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setPlanLoading(false);
    }
  };

  const handlePlanDelete = async (id: string) => {
    if (!confirm('确定要删除该方案吗？删除后不可恢复。')) return;
    try {
      await api.deleteElevatorPlan(id);
      showToast('方案删除成功', 'success');
      fetchPlans();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handlePlanToggle = async (plan: ElevatorPlan) => {
    try {
      await api.updateElevatorPlan(plan.id, { isActive: !plan.isActive });
      showToast(`方案已${plan.isActive ? '停用' : '启用'}`, 'success');
      fetchPlans();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const stats = {
    brandTotal: brands.length,
    brandActive: brands.filter((b) => b.isActive).length,
    planTotal: plans.length,
    planActive: plans.filter((p) => p.isActive).length,
  };

  return (
    <div className="container py-8 animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/proposals" className="inline-flex items-center gap-1.5 hover:text-primary-700 transition-colors">
          <Home className="w-4 h-4" />
          提案广场
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-700 font-medium">电梯配置库</span>
      </nav>

      <div className="card p-6 mb-6 relative overflow-hidden grain-overlay">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-accent-100 to-primary-100 opacity-60" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-2xl text-slate-900">电梯品牌与方案配置库</h1>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              管理员维护可选电梯品牌列表及对应报价方案，发起新提案时可从配置库选择自动填充
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-2xl font-bold text-primary-700">{stats.brandActive}</div>
                <div className="text-[10px] text-slate-500">启用品牌 / 共{stats.brandTotal}</div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-center">
                <div className="text-2xl font-bold text-accent-700">{stats.planActive}</div>
                <div className="text-[10px] text-slate-500">启用方案 / 共{stats.planTotal}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-2 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/70">
          <button
            onClick={() => setActiveTab('brands')}
            className={cn(
              'tab-btn',
              activeTab === 'brands' && 'tab-btn-active'
            )}
          >
            <Building2 className="w-4 h-4" />
            品牌管理
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={cn(
              'tab-btn',
              activeTab === 'plans' && 'tab-btn-active'
            )}
          >
            <Package className="w-4 h-4" />
            方案管理
          </button>
          <div className="ml-auto" />
          {activeTab === 'plans' && (
            <div className="relative mx-2">
              <select
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
                className="input-base !py-2 !text-sm appearance-none pr-8 !bg-white"
              >
                <option value="">全部品牌</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={() => {
              if (activeTab === 'brands') {
                setEditingBrand(null);
                setShowBrandModal(true);
              } else {
                setEditingPlan(null);
                setShowPlanModal(true);
              }
            }}
            className="btn-accent !py-2 !px-4"
          >
            <Plus className="w-4 h-4" />
            新增{activeTab === 'brands' ? '品牌' : '方案'}
          </button>
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
      ) : activeTab === 'brands' ? (
        brands.length === 0 ? (
          <div className="card p-16 text-center">
            <Building2 className="w-14 h-14 mx-auto text-slate-300 mb-4" />
            <div className="text-lg font-semibold text-slate-700">暂无电梯品牌</div>
            <div className="text-sm text-slate-500 mt-1">点击右上角「新增品牌」添加第一个电梯品牌</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className={cn(
                  'card p-5 transition-all duration-200 hover:shadow-md',
                  !brand.isActive && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-primary-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{brand.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">{brand.country}</div>
                    </div>
                  </div>
                  <span className={cn('badge text-[11px]', brand.isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                    {brand.isActive ? '启用' : '停用'}
                  </span>
                </div>

                {brand.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{brand.description}</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleBrandToggle(brand)}
                    className="flex-1 btn-outline !py-2 !text-xs"
                    title={brand.isActive ? '点击停用' : '点击启用'}
                  >
                    {brand.isActive ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        停用
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        启用
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBrand(brand);
                      setShowBrandModal(true);
                    }}
                    className="flex-1 btn-outline !py-2 !text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleBrandDelete(brand.id)}
                    className="flex-1 btn-outline !py-2 !text-xs !text-danger-600 !border-danger-200 hover:!bg-danger-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : plans.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-14 h-14 mx-auto text-slate-300 mb-4" />
          <div className="text-lg font-semibold text-slate-700">暂无电梯方案</div>
          <div className="text-sm text-slate-500 mt-1">
            {filterBrandId ? '当前品牌下暂无方案' : '点击右上角「新增方案」添加第一个电梯方案'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'card p-5 transition-all duration-200 hover:shadow-md',
                !plan.isActive && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                    <span className="badge bg-primary-100 text-primary-700 border-primary-200 text-[11px]">
                      {plan.brandName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {STRUCTURE_TYPE_LABELS[plan.structureType]} · {DRIVE_TYPE_LABELS[plan.driveType]} · {MACHINE_ROOM_TYPE_LABELS[plan.machineRoomType]}
                  </div>
                </div>
                <span className={cn('badge text-[11px]', plan.isActive ? 'bg-success-100 text-success-700 border-success-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                  {plan.isActive ? '启用' : '停用'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-accent-50 border border-accent-100">
                  <div className="text-lg font-bold text-accent-700">
                    {formatCurrency(plan.basePrice)}
                  </div>
                  <div className="text-[10px] text-accent-600">基础报价</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-primary-50 border border-primary-100">
                  <div className="text-lg font-bold text-primary-700">{plan.constructionDays}天</div>
                  <div className="text-[10px] text-primary-600">施工周期</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-success-50 border border-success-100">
                  <div className="text-lg font-bold text-success-700">{plan.warrantyYears}年</div>
                  <div className="text-[10px] text-success-600">质保年限</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span>{plan.loadCapacity}kg / {plan.passengerCount}人</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <span>{plan.speed}m/s</span>
                </div>
              </div>

              {plan.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]"
                    >
                      {f}
                    </span>
                  ))}
                  {plan.features.length > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px]">
                      +{plan.features.length - 4}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePlanToggle(plan)}
                  className="flex-1 btn-outline !py-2 !text-xs"
                >
                  {plan.isActive ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      停用
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      启用
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setShowPlanModal(true);
                  }}
                  className="flex-1 btn-outline !py-2 !text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => handlePlanDelete(plan.id)}
                  className="flex-1 btn-outline !py-2 !text-xs !text-danger-600 !border-danger-200 hover:!bg-danger-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showBrandModal && (
        <BrandModal
          brand={editingBrand}
          onClose={() => {
            setShowBrandModal(false);
            setEditingBrand(null);
          }}
          onSubmit={handleBrandSubmit}
          loading={brandLoading}
        />
      )}

      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          brands={brands.filter((b) => b.isActive)}
          onClose={() => {
            setShowPlanModal(false);
            setEditingPlan(null);
          }}
          onSubmit={handlePlanSubmit}
          loading={planLoading}
        />
      )}
    </div>
  );
}
