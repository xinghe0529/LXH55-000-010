import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import db from './lib/db.js';
import { calcFloorCoefficient } from '../shared/calculator.js';
import type { VoteOption, Proposal, ProgressNodeStatus, ConstructionDailyReport, NotificationType, NotificationPriority } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

function ok<T>(res: Response, data: T) {
  res.status(200).json({ success: true, data });
}
function fail(res: Response, msg: string, code = 400) {
  res.status(code).json({ success: false, error: msg });
}

app.get('/api/health', (_req, res) => {
  ok(res, { message: 'ok', ts: new Date().toISOString() });
});

app.get('/api/proposals', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const list = db.getProposals({ status, search });
  const enriched = list.map((p) => ({
    ...p,
    voteResult: db.getVoteResult(p.id),
  }));
  ok(res, enriched);
});

app.get('/api/proposals/stats', (_req, res) => {
  const all = db.getProposals();
  const stats = {
    total: all.length,
    voting: all.filter((p) => p.status === 'voting').length,
    construction: all.filter((p) => p.status === 'construction').length,
    completed: all.filter((p) => p.status === 'completed').length,
    households: all.reduce((s, p) => s + p.totalHouseholds, 0),
    totalCost: all
      .filter((p) => p.status === 'construction' || p.status === 'completed')
      .reduce((s, p) => s + p.estimatedTotalCost, 0),
  };
  ok(res, stats);
});

app.post('/api/proposals', (req, res) => {
  const body = req.body as Partial<Proposal>;
  if (
    !body.communityName ||
    !body.buildingNumber ||
    !body.totalFloors ||
    !body.estimatedTotalCost ||
    !body.elevatorPlan ||
    !body.estimatedDuration ||
    !body.initiator
  ) {
    return fail(res, '缺少必填字段');
  }
  const unitsCount = body.unitsCount || 1;
  const householdsPerUnit = body.householdsPerUnit || 2;
  const now = new Date();
  const start = now.toISOString().split('T')[0];
  const end = new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0];
  const p = db.createProposal({
    communityName: body.communityName,
    buildingNumber: body.buildingNumber,
    totalFloors: +body.totalFloors,
    unitsCount: +unitsCount,
    householdsPerUnit: +householdsPerUnit,
    estimatedTotalCost: +body.estimatedTotalCost,
    elevatorPlan: body.elevatorPlan,
    estimatedDuration: +body.estimatedDuration,
    initiator: body.initiator,
    votingStartDate: body.votingStartDate || start,
    votingEndDate: body.votingEndDate || end,
  });
  ok(res, p);
});

app.get('/api/proposals/:id', (req, res) => {
  const p = db.getProposal(req.params.id);
  if (!p) return fail(res, '提案不存在', 404);
  ok(res, p);
});

app.get('/api/proposals/:id/households', (req, res) => {
  const hh = db.getHouseholds(req.params.id);
  ok(res, hh);
});

app.get('/api/proposals/:id/fee-estimate', (req, res) => {
  const data = db.getFeeEstimate(req.params.id);
  if (!data) return fail(res, '提案不存在', 404);
  ok(res, data);
});

app.post('/api/votes', (req, res) => {
  const { proposalId, householdId, option } = req.body as {
    proposalId: string;
    householdId: string;
    option: VoteOption;
  };
  if (!proposalId || !householdId || !['agree', 'disagree', 'abstain'].includes(option)) {
    return fail(res, '参数不合法');
  }
  const hh = db.getHouseholds(proposalId).find((h) => h.id === householdId);
  if (!hh) return fail(res, '住户不存在');
  const weight = option === 'abstain' ? 0 : hh.floorCoefficient;
  const r = db.submitVote({ proposalId, householdId, option, weight });
  if ('error' in r) return fail(res, r.error);

  const p = db.getProposal(proposalId);
  if (p) {
    const result = db.getVoteResult(proposalId);
    if (result && (result.votingRate >= 95 || (result.votingRate >= 50 && (result.weightedAgreeRate >= 66.67 || result.weightedAgreeRate < 50)))) {
      if (p.status === 'voting') {
        dispatchNotification({
          type: 'vote_result',
          priority: result.passed ? 'medium' : 'high',
          proposalId,
          title: `${p.communityName}${p.buildingNumber}投票结果出炉`,
          content: result.passed
            ? `投票已通过！参与率${result.votingRate.toFixed(1)}%，同意率${result.weightedAgreeRate.toFixed(1)}%。`
            : `很遗憾，本次投票未通过。参与率${result.votingRate.toFixed(1)}%，同意率${result.weightedAgreeRate.toFixed(1)}%。`,
          relatedId: proposalId,
          data: { passed: result.passed, votingRate: result.votingRate, weightedAgreeRate: result.weightedAgreeRate },
        });
      }
    }
  }
  ok(res, r);
});

app.get('/api/proposals/:id/vote-result', (req, res) => {
  const r = db.getVoteResult(req.params.id);
  if (!r) return fail(res, '提案不存在', 404);
  ok(res, r);
});

app.get('/api/proposals/:id/my-vote', (req, res) => {
  const { householdId } = req.query;
  if (typeof householdId !== 'string') return fail(res, '缺少householdId');
  const v = db.hasVoted(req.params.id, householdId);
  ok(res, v || null);
});

app.post('/api/appeals', (req, res) => {
  const { proposalId, householdId, reason, evidenceUrls } = req.body as {
    proposalId: string;
    householdId: string;
    reason: string;
    evidenceUrls?: string[];
  };
  if (!proposalId || !householdId || !reason) return fail(res, '缺少必填字段');
  const a = db.submitAppeal({ proposalId, householdId, reason, evidenceUrls });
  ok(res, a);
});

app.get('/api/proposals/:id/appeals', (req, res) => {
  ok(res, db.getAppeals(req.params.id));
});

app.get('/api/proposals/:id/progress', (req, res) => {
  ok(res, db.getProgressNodes(req.params.id));
});

app.put('/api/proposals/:id/progress/:nodeId', (req, res) => {
  const { status, startDate, endDate } = req.body as {
    status?: ProgressNodeStatus;
    startDate?: string;
    endDate?: string;
  };
  const nodesBefore = db.getProgressNodes(req.params.id);
  const nodeBefore = nodesBefore.find((n) => n.id === req.params.nodeId);
  const patch: Parameters<typeof db.updateProgressNode>[2] = {};
  if (status) patch.status = status;
  if (startDate !== undefined) patch.startDate = startDate;
  if (endDate !== undefined) patch.endDate = endDate;
  const n = db.updateProgressNode(req.params.id, req.params.nodeId, patch);
  if (!n) return fail(res, '节点不存在', 404);
  if (status === 'completed' && nodeBefore?.status !== 'completed') {
    const p = db.getProposal(req.params.id);
    if (p) {
      dispatchNotification({
        type: 'progress_node',
        priority: 'medium',
        proposalId: req.params.id,
        title: `${p.communityName}${p.buildingNumber}施工进度更新`,
        content: `「${n.title}」阶段已完成！点击查看施工详情。`,
        relatedId: n.id,
        data: { nodeId: n.id, nodeTitle: n.title, stepIndex: n.stepIndex },
      });
    }
  }
  ok(res, n);
});

app.get('/api/proposals/:id/finances', (req, res) => {
  const records = db.getFinances(req.params.id);
  const summary = records.reduce(
    (acc, r) => {
      acc.budget += r.budgetAmount;
      acc.actual += r.actualAmount;
      return acc;
    },
    { budget: 0, actual: 0 }
  );
  ok(res, { records, summary });
});

app.post('/api/finances', (req, res) => {
  const body = req.body as Parameters<typeof db.addFinance>[0] & {
    triggerPaymentReminder?: boolean;
    reminderRecipientIds?: string[];
  };
  if (
    !body.proposalId ||
    !body.category ||
    !body.categoryName ||
    !body.description ||
    body.budgetAmount == null
  ) {
    return fail(res, '缺少必填字段');
  }
  const r = db.addFinance({
    ...body,
    budgetAmount: +body.budgetAmount,
    actualAmount: body.actualAmount != null ? +body.actualAmount : 0,
  });

  if (body.triggerPaymentReminder) {
    const p = db.getProposal(body.proposalId);
    if (p) {
      const hh = db.getHouseholds(body.proposalId);
      const estimate = db.getFeeEstimate(body.proposalId);
      const recipientIds = body.reminderRecipientIds?.length
        ? body.reminderRecipientIds
        : hh.map((h) => h.id);
      for (const rid of recipientIds) {
        const feeItem = estimate?.items.find((i) => i.householdId === rid);
        const household = hh.find((h) => h.id === rid);
        dispatchNotification({
          type: 'payment_reminder',
          priority: 'high',
          proposalId: body.proposalId,
          title: `${p.communityName}${p.buildingNumber}资金催缴通知`,
          content: `尊敬的${household?.floor}楼${household?.roomNumber}业主，${body.categoryName}阶段已产生费用。您需分摊费用约${feeItem ? Math.round(feeItem.estimatedFee).toLocaleString() : '0'}元，请及时缴纳。`,
          recipientIds: [rid],
          relatedId: r.id,
          data: {
            financeId: r.id,
            category: body.category,
            categoryName: body.categoryName,
            estimatedFee: feeItem?.estimatedFee || 0,
          },
        });
      }
    }
  }

  ok(res, r);
});

app.get('/api/calc/floor-coefficient', (req, res) => {
  const floor = Number(req.query.floor);
  if (!Number.isFinite(floor)) return fail(res, 'floor参数必须为数字');
  ok(res, { floor, coefficient: calcFloorCoefficient(floor) });
});

app.get('/api/proposals/:id/daily-reports', (req, res) => {
  const { progressNodeId, startDate, endDate } = req.query;
  const params = {
    progressNodeId: typeof progressNodeId === 'string' ? progressNodeId : undefined,
    startDate: typeof startDate === 'string' ? startDate : undefined,
    endDate: typeof endDate === 'string' ? endDate : undefined,
  };
  const reports = db.getDailyReports(req.params.id, params);
  ok(res, reports);
});

app.get('/api/proposals/:id/daily-reports/:reportId', (req, res) => {
  const r = db.getDailyReport(req.params.id, req.params.reportId);
  if (!r) return fail(res, '日报不存在', 404);
  ok(res, r);
});

app.post('/api/proposals/:id/daily-reports', (req, res) => {
  const body = req.body as Omit<ConstructionDailyReport, 'id' | 'createdAt' | 'updatedAt'>;
  if (!body.reportDate || !body.constructionContent || !body.constructionProgress || !body.reporter) {
    return fail(res, '缺少必填字段：日期、施工内容、进度描述、上报人');
  }
  const p = db.getProposal(req.params.id);
  if (!p) return fail(res, '提案不存在', 404);
  if (p.status !== 'construction') {
    return fail(res, '当前提案状态不允许提交施工日报');
  }
  const existing = db.getDailyReports(req.params.id).find((r) => r.reportDate === body.reportDate);
  if (existing) {
    return fail(res, '该日期已存在施工日报，请修改或删除原有日报');
  }
  const r = db.addDailyReport({
    ...body,
    proposalId: req.params.id,
    photos: body.photos || [],
  });
  ok(res, r);
});

app.put('/api/proposals/:id/daily-reports/:reportId', (req, res) => {
  const body = req.body as Partial<Omit<ConstructionDailyReport, 'id' | 'proposalId' | 'createdAt'>>;
  const r = db.updateDailyReport(req.params.id, req.params.reportId, body);
  if (!r) return fail(res, '日报不存在', 404);
  ok(res, r);
});

app.delete('/api/proposals/:id/daily-reports/:reportId', (req, res) => {
  const success = db.deleteDailyReport(req.params.id, req.params.reportId);
  if (!success) return fail(res, '日报不存在', 404);
  ok(res, { message: '删除成功' });
});

function dispatchNotification(data: {
  type: NotificationType;
  priority: NotificationPriority;
  proposalId: string;
  title: string;
  content: string;
  recipientIds?: string[];
  relatedId?: string;
  data?: Record<string, unknown>;
}) {
  const p = db.getProposal(data.proposalId);
  if (!p) return;
  const hh = db.getHouseholds(data.proposalId);
  const recipientIds = data.recipientIds && data.recipientIds.length > 0
    ? data.recipientIds
    : hh.map((h) => h.id);
  db.createNotification({
    type: data.type,
    priority: data.priority,
    recipientType: data.recipientIds && data.recipientIds.length > 0 ? 'household' : 'all',
    recipientIds,
    proposalId: data.proposalId,
    title: data.title,
    content: data.content,
    relatedId: data.relatedId,
    data: data.data,
  });
}

app.get('/api/notifications', (req, res) => {
  const householdId = typeof req.query.householdId === 'string' ? req.query.householdId : undefined;
  const proposalId = typeof req.query.proposalId === 'string' ? req.query.proposalId : undefined;
  const unreadOnly = req.query.unreadOnly === 'true';
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  if (!householdId) return fail(res, '缺少householdId参数');
  const list = db.getNotifications({ householdId, proposalId, unreadOnly, limit });
  ok(res, list);
});

app.get('/api/notifications/unread-count', (req, res) => {
  const householdId = typeof req.query.householdId === 'string' ? req.query.householdId : undefined;
  const proposalId = typeof req.query.proposalId === 'string' ? req.query.proposalId : undefined;
  if (!householdId) return fail(res, '缺少householdId参数');
  const count = db.getUnreadCount(householdId, proposalId);
  ok(res, { count });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const householdId = req.body.householdId as string | undefined;
  if (!householdId) return fail(res, '缺少householdId');
  const success = db.markAsRead(req.params.id, householdId);
  if (!success) return fail(res, '通知不存在', 404);
  ok(res, { message: '已标记为已读' });
});

app.post('/api/notifications/read-all', (req, res) => {
  const householdId = req.body.householdId as string | undefined;
  const proposalId = typeof req.body.proposalId === 'string' ? req.body.proposalId : undefined;
  if (!householdId) return fail(res, '缺少householdId');
  const count = db.markAllAsRead(householdId, proposalId);
  ok(res, { count, message: `已标记${count}条为已读` });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server error]', error);
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export default app;
