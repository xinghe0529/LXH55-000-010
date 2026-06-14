import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  FileText,
  Building2,
  Calendar,
  Activity,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type Proposal,
  type ProgressNode,
  type ConstructionDailyReport,
} from '../../shared/types';
import { cn } from '../lib/utils';
import DailyReportTimeline from '../components/DailyReportTimeline';
import DailyReportForm from '../components/DailyReportForm';

function StatusBadge({ status }: { status: Proposal['status'] }) {
  return (
    <span className={cn('badge', STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function DailyReportsPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useUIStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [progress, setProgress] = useState<ProgressNode[]>([]);
  const [reports, setReports] = useState<ConstructionDailyReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editReport, setEditReport] = useState<ConstructionDailyReport | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, prog, rpts] = await Promise.all([
        api.getProposal(id),
        api.getProgress(id),
        api.getDailyReports(id),
      ]);
      setProposal(p);
      setProgress(prog);
      setReports(rpts);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddReport = () => {
    setEditReport(null);
    setShowForm(true);
  };

  const handleEditReport = (report: ConstructionDailyReport) => {
    setEditReport(report);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditReport(null);
  };

  const handleFormSubmitted = () => {
    handleFormClose();
    loadData();
  };

  const canEdit = proposal?.status === 'construction';

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
          <div className="card p-6 animate-pulse h-96" />
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
            <ChevronLeft className="w-4 h-4" />
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
            to={`/proposal/${id}/progress`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15 text-sm font-medium text-primary-100 hover:bg-white/20 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            返回进度看板
          </Link>

          <div className="flex flex-wrap items-start gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="hero-title text-3xl md:text-4xl lg:text-5xl !text-white">
                {proposal.communityName}
                <span className="text-accent-300 ml-2 md:ml-3">{proposal.buildingNumber}</span>
                <span className="text-xl md:text-2xl text-primary-200 ml-2 md:ml-3 font-normal">
                  施工日报
                </span>
              </h1>
              <p className="mt-2 text-sm md:text-base text-primary-100/90">
                每日施工进度记录 · 现场照片实时上传 · 工程动态全程透明
              </p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-100">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-accent-300" />
              {proposal.totalFloors}层 · {proposal.unitsCount}单元 · {proposal.totalHouseholds}户
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent-300" />
              预计工期 {proposal.estimatedDuration} 天
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-accent-300" />
              已提交 {reports.length} 条日报
            </span>
          </div>
        </div>
      </section>

      <section className="container py-8 -mt-10 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800">施工日报时间线</h2>
              <p className="text-xs text-slate-500">按日期倒序展示每日施工动态</p>
            </div>
          </div>

          {canEdit && (
            <button onClick={handleAddReport} className="btn-primary">
              <Plus className="w-4 h-4" />
              提交今日日报
            </button>
          )}

          {!canEdit && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm">
              <Activity className="w-4 h-4" />
              当前状态不可提交日报
            </div>
          )}
        </div>

        <div className="card p-6 grain-overlay">
          <DailyReportTimeline
            reports={reports}
            progressNodes={progress}
            canEdit={canEdit}
            onEdit={handleEditReport}
            onDeleted={loadData}
          />
        </div>
      </section>

      {showForm && (
        <DailyReportForm
          proposalId={id!}
          progressNodes={progress}
          onClose={handleFormClose}
          onSubmitted={handleFormSubmitted}
          editReport={editReport}
        />
      )}
    </div>
  );
}
