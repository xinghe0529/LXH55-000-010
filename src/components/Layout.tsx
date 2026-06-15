import { Link, NavLink, Outlet } from 'react-router-dom';
import { Building2, Vote, Gauge, Plus, Search, X, CheckCircle2, AlertCircle, Info, ShieldAlert, Settings, MessageSquare } from 'lucide-react';
import { useUIStore } from '../store/ui';
import { cn } from '../lib/utils';
import { NotificationPanel } from './NotificationPanel';

function Toast() {
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);
  if (!toast) return null;
  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;
  const color =
    toast.type === 'success'
      ? 'bg-success-50 border-success-500 text-success-700'
      : toast.type === 'error'
      ? 'bg-danger-50 border-danger-500 text-danger-700'
      : 'bg-primary-50 border-primary-500 text-primary-700';
  return (
    <div className="fixed top-5 right-5 z-[100] animate-slide-up">
      <div className={cn('flex items-center gap-3 px-5 py-3 rounded-xl shadow-card border-l-4 bg-white min-w-[260px]', color)}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium flex-1">{toast.message}</span>
        <button onClick={clearToast} className="text-slate-400 hover:text-slate-700">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
      isActive
        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
        : 'text-slate-600 hover:text-primary-700 hover:bg-primary-50'
    );
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/60">
        <div className="container flex items-center justify-between h-16">
          <Link to="/proposals" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg text-primary-900">加装电梯</div>
              <div className="text-[11px] text-slate-500 font-medium">居民投票与进度追踪平台</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100/70">
            <NavLink to="/proposals" className={navClass}>
              <Building2 className="w-4 h-4" />
              提案广场
            </NavLink>
            <NavLink to="/appeals" className={navClass}>
              <ShieldAlert className="w-4 h-4" />
              申诉审核
            </NavLink>
            <NavLink to="/issues" className={navClass}>
              <MessageSquare className="w-4 h-4" />
              问题反馈
            </NavLink>
            <NavLink to="/elevator-config" className={navClass}>
              <Settings className="w-4 h-4" />
              配置库
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button className="btn-ghost hidden lg:inline-flex">
              <Search className="w-4 h-4" />
            </button>
            <NotificationPanel />
            <button
              onClick={() => useUIStore.getState().setNewProposalModal(true)}
              className="btn-accent"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">发起提案</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} 老旧小区加装电梯数字化服务平台</div>
          <div className="flex items-center gap-4">
            <span>
              <Vote className="w-3.5 h-3.5 inline mr-1" />
              公开公正透明
            </span>
            <span>
              <Gauge className="w-3.5 h-3.5 inline mr-1" />
              进度实时同步
            </span>
          </div>
        </div>
      </footer>
      <Toast />
    </div>
  );
}
