import { useState, useMemo } from 'react';
import {
  Calendar,
  Cloud,
  Thermometer,
  Users,
  Package,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  CheckCircle,
  XCircle,
  ZoomIn,
  TrendingUp,
} from 'lucide-react';
import type { ConstructionDailyReport, ProgressNode } from '../../shared/types';
import { useUIStore } from '../store/ui';
import api from '../lib/apiClient';

interface DailyReportTimelineProps {
  reports: ConstructionDailyReport[];
  progressNodes: ProgressNode[];
  canEdit?: boolean;
  onEdit?: (report: ConstructionDailyReport) => void;
  onDeleted?: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`;
}

function ReportCard({
  report,
  progressNodes,
  canEdit,
  onEdit,
  onDelete,
}: {
  report: ConstructionDailyReport;
  progressNodes: ProgressNode[];
  canEdit?: boolean;
  onEdit?: (report: ConstructionDailyReport) => void;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const showToast = useUIStore((s) => s.showToast);

  const node = progressNodes.find((n) => n.id === report.progressNodeId);

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条施工日报吗？此操作不可恢复。')) return;
    try {
      await api.deleteDailyReport(report.proposalId, report.id);
      showToast('删除成功', 'success');
      onDelete?.();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  return (
    <div className="relative pl-16 pb-8 last:pb-0">
      <div className="absolute left-0 top-1 bottom-0 w-1.5 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-400 via-primary-500 to-accent-500 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-400 via-primary-500 to-accent-500" />
      </div>

      <div className="absolute left-0 top-1 -translate-x-[calc(50%-0.3rem)] w-8 h-8 flex items-center justify-center z-10">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg shadow-primary-500/30 flex items-center justify-center ring-4 ring-white">
          <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
        <div
          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-primary-50/30 border-b border-slate-100 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <div className="font-display font-bold text-slate-800 text-lg">
                {formatDate(report.reportDate)}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                {report.weather && (
                  <span className="inline-flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-primary-500" />
                    {report.weather}
                  </span>
                )}
                {report.temperature && (
                  <span className="inline-flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-accent-500" />
                    {report.temperature}
                  </span>
                )}
                {node && (
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-medium">
                    <Layers className="w-3 h-3" />
                    {node.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit?.(report)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="编辑"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.workerCount != null && report.workerCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">施工人数</div>
                    <div className="text-sm font-bold text-slate-800">{report.workerCount} 人</div>
                  </div>
                </div>
              )}
              {report.reporter && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">上报人</div>
                    <div className="text-sm font-bold text-slate-800">{report.reporter}</div>
                  </div>
                </div>
              )}
              {node && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">施工阶段</div>
                    <div className="text-sm font-bold text-slate-800">{node.title}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary-600" />
                  今日施工内容
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl">
                  {report.constructionContent}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                  施工进度
                </div>
                <p className="text-sm text-primary-700 font-medium bg-primary-50/50 p-3 rounded-xl">
                  {report.constructionProgress}
                </p>
              </div>

              {report.materials && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                    材料使用
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl">
                    {report.materials}
                  </p>
                </div>
              )}

              {report.issues && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    存在问题
                  </div>
                  <p className="text-sm text-danger-700 bg-danger-50 p-3 rounded-xl border border-danger-100">
                    {report.issues}
                  </p>
                </div>
              )}

              {report.nextPlan && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-600" />
                    明日计划
                  </div>
                  <p className="text-sm text-slate-600 bg-accent-50/50 p-3 rounded-xl border border-accent-100">
                    {report.nextPlan}
                  </p>
                </div>
              )}
            </div>

            {report.photos && report.photos.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
                  <ImageIcon className="w-3.5 h-3.5 text-primary-600" />
                  施工照片 ({report.photos.length})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {report.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 hover:border-primary-400 transition-all"
                      onClick={() => setSelectedPhoto(photo.url)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.description || `照片 ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <div className="flex items-center justify-center gap-1 text-white text-xs">
                            <ZoomIn className="w-3.5 h-3.5" />
                            点击查看大图
                          </div>
                          {photo.description && (
                            <div className="text-white text-[11px] mt-1 text-center line-clamp-1">
                              {photo.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {photo.description && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] max-w-[80%] truncate">
                          {photo.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] mx-4">
            <img
              src={selectedPhoto}
              alt="放大查看"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyReportTimeline({
  reports,
  progressNodes,
  canEdit,
  onEdit,
  onDeleted,
}: DailyReportTimelineProps) {
  const [filterNodeId, setFilterNodeId] = useState<string>('');

  const filteredReports = useMemo(() => {
    if (!filterNodeId) return reports;
    return reports.filter((r) => r.progressNodeId === filterNodeId);
  }, [reports, filterNodeId]);

  const stats = useMemo(() => {
    const total = reports.length;
    const hasPhotos = reports.filter((r) => r.photos && r.photos.length > 0).length;
    const hasIssues = reports.filter((r) => r.issues).length;
    return { total, hasPhotos, hasIssues };
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-200 mb-4" />
        <div className="text-lg font-semibold text-slate-600">暂无施工日报</div>
        <div className="text-sm text-slate-400 mt-1">施工方尚未提交任何施工进度记录</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-100">
            <FileText className="w-4.5 h-4.5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">
              共 {stats.total} 条日报
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100">
            <ImageIcon className="w-4.5 h-4.5 text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              {stats.hasPhotos} 条含照片
            </span>
          </div>
          {stats.hasIssues > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-50 border border-danger-100">
              <AlertTriangle className="w-4.5 h-4.5 text-danger-600" />
              <span className="text-sm font-semibold text-danger-700">
                {stats.hasIssues} 条问题记录
              </span>
            </div>
          )}
        </div>

        {progressNodes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">按阶段筛选：</span>
            <select
              className="input-base !py-1.5 !text-sm !w-auto"
              value={filterNodeId}
              onChange={(e) => setFilterNodeId(e.target.value)}
            >
              <option value="">全部阶段</option>
              {progressNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.stepIndex + 1}. {node.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <Layers className="w-14 h-14 mx-auto text-slate-300 mb-3" />
          <div className="text-base font-medium text-slate-500">该施工阶段暂无日报记录</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              progressNodes={progressNodes}
              canEdit={canEdit}
              onEdit={onEdit}
              onDelete={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
