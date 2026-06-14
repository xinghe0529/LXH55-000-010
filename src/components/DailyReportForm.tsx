import { useState, useRef } from 'react';
import {
  X,
  Plus,
  Image as ImageIcon,
  Calendar,
  Thermometer,
  Cloud,
  Users,
  Package,
  AlertTriangle,
  Clock,
  FileText,
  Trash2,
  Upload,
  TrendingUp,
} from 'lucide-react';
import type { ConstructionDailyReport, ConstructionDailyPhoto, ProgressNode } from '../../shared/types';
import { WEATHER_OPTIONS } from '../../shared/types';
import { cn } from '../lib/utils';
import api from '../lib/apiClient';
import { useUIStore } from '../store/ui';

interface DailyReportFormProps {
  proposalId: string;
  progressNodes: ProgressNode[];
  onClose: () => void;
  onSubmitted: () => void;
  editReport?: ConstructionDailyReport | null;
}

export default function DailyReportForm({
  proposalId,
  progressNodes,
  onClose,
  onSubmitted,
  editReport,
}: DailyReportFormProps) {
  const showToast = useUIStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const constructionNodes = progressNodes.filter(
    (n) => n.status === 'in_progress' || n.status === 'completed'
  );

  const [formData, setFormData] = useState({
    reportDate: editReport?.reportDate || today,
    progressNodeId: editReport?.progressNodeId || constructionNodes.find((n) => n.status === 'in_progress')?.id || '',
    weather: editReport?.weather || '',
    temperature: editReport?.temperature || '',
    constructionContent: editReport?.constructionContent || '',
    constructionProgress: editReport?.constructionProgress || '',
    workerCount: editReport?.workerCount || 0,
    materials: editReport?.materials || '',
    issues: editReport?.issues || '',
    nextPlan: editReport?.nextPlan || '',
    reporter: editReport?.reporter || '',
  });

  const [photos, setPhotos] = useState<ConstructionDailyPhoto[]>(editReport?.photos || []);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setPhotos((prev) => [...prev, { url, description: '' }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhotoDescription = (index: number, description: string) => {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reportDate || !formData.constructionContent || !formData.constructionProgress || !formData.reporter) {
      showToast('请填写必填字段：日期、施工内容、进度描述、上报人', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        photos,
        workerCount: formData.workerCount || undefined,
        progressNodeId: formData.progressNodeId || undefined,
        weather: formData.weather || undefined,
        temperature: formData.temperature || undefined,
        materials: formData.materials || undefined,
        issues: formData.issues || undefined,
        nextPlan: formData.nextPlan || undefined,
      };

      if (editReport) {
        await api.updateDailyReport(proposalId, editReport.id, data);
        showToast('施工日报更新成功', 'success');
      } else {
        await api.addDailyReport(proposalId, data);
        showToast('施工日报提交成功', 'success');
      }
      onSubmitted();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white border-b border-primary-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">
                {editReport ? '编辑施工日报' : '提交施工日报'}
              </h2>
              <p className="text-xs text-primary-100/80">记录每日施工进度与现场情况</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                施工日期 <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                className="input-base"
                value={formData.reportDate}
                onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                max={today}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                上报人 <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="如：施工队 李队长"
                value={formData.reporter}
                onChange={(e) => setFormData({ ...formData, reporter: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Cloud className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                天气
              </label>
              <select
                className="input-base"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
              >
                <option value="">请选择天气</option>
                {WEATHER_OPTIONS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Thermometer className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                温度
              </label>
              <input
                type="text"
                className="input-base"
                placeholder="如：25°C"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                施工人数
              </label>
              <input
                type="number"
                min="0"
                className="input-base"
                placeholder="如：8"
                value={formData.workerCount || ''}
                onChange={(e) => setFormData({ ...formData, workerCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
              关联施工阶段
            </label>
            <select
              className="input-base"
              value={formData.progressNodeId}
              onChange={(e) => setFormData({ ...formData, progressNodeId: e.target.value })}
            >
              <option value="">请选择施工阶段（可选）</option>
              {constructionNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.stepIndex + 1}. {node.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
              今日施工内容 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input-base min-h-[80px] resize-y"
              placeholder="请详细描述今日完成的施工内容..."
              value={formData.constructionContent}
              onChange={(e) => setFormData({ ...formData, constructionContent: e.target.value })}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
              施工进度描述 <span className="text-danger-500">*</span>
            </label>
            <textarea
              className="input-base min-h-[60px] resize-y"
              placeholder="如：钢结构施工阶段，整体进度45%"
              value={formData.constructionProgress}
              onChange={(e) => setFormData({ ...formData, constructionProgress: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <Package className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                主要材料使用
              </label>
              <textarea
                className="input-base min-h-[60px] resize-y"
                placeholder="如：钢筋3吨，混凝土40立方"
                value={formData.materials}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
                存在问题
              </label>
              <textarea
                className="input-base min-h-[60px] resize-y"
                placeholder="如无问题可留空"
                value={formData.issues}
                onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
              明日施工计划
            </label>
            <textarea
              className="input-base min-h-[60px] resize-y"
              placeholder="请描述明日计划完成的工作内容..."
              value={formData.nextPlan}
              onChange={(e) => setFormData({ ...formData, nextPlan: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              <ImageIcon className="w-3.5 h-3.5 inline mr-1.5 text-primary-600" />
              施工照片
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100">
                    <img
                      src={photo.url}
                      alt={photo.description || `施工照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-danger-500 text-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    className="mt-1.5 w-full text-xs px-2 py-1 rounded-md border border-slate-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                    placeholder="照片说明"
                    value={photo.description || ''}
                    onChange={(e) => updatePhotoDescription(index, e.target.value)}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                  'border-slate-300 hover:border-primary-400 hover:bg-primary-50/50 text-slate-400 hover:text-primary-600'
                )}
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">添加照片</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <p className="text-xs text-slate-400">支持 JPG、PNG 格式，可多选上传</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {editReport ? '保存修改' : '提交日报'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
