import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import db from './lib/db.js';
import { calcFloorCoefficient } from '../shared/calculator.js';
import type { VoteOption, Proposal, ProgressNodeStatus } from '../shared/types.js';

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
  const patch: Parameters<typeof db.updateProgressNode>[2] = {};
  if (status) patch.status = status;
  if (startDate !== undefined) patch.startDate = startDate;
  if (endDate !== undefined) patch.endDate = endDate;
  const n = db.updateProgressNode(req.params.id, req.params.nodeId, patch);
  if (!n) return fail(res, '节点不存在', 404);
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
  const body = req.body as Parameters<typeof db.addFinance>[0];
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
  ok(res, r);
});

app.get('/api/calc/floor-coefficient', (req, res) => {
  const floor = Number(req.query.floor);
  if (!Number.isFinite(floor)) return fail(res, 'floor参数必须为数字');
  ok(res, { floor, coefficient: calcFloorCoefficient(floor) });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[server error]', error);
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

export default app;
