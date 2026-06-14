import type {
  Proposal,
  Household,
  VoteRecord,
  Appeal,
  ProgressNode,
  FinanceRecord,
} from '../../shared/types.js';
import {
  generateHouseholds,
  generateProgressNodes,
  calcFeeDistribution,
  calcWeightedVoteResult,
  genId,
} from '../../shared/calculator.js';

class DataStore {
  private proposals: Proposal[] = [];
  private households: Map<string, Household[]> = new Map();
  private votes: VoteRecord[] = [];
  private appeals: Appeal[] = [];
  private progressNodes: Map<string, ProgressNode[]> = new Map();
  private financeRecords: Map<string, FinanceRecord[]> = new Map();

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    const now = new Date();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d.toISOString().split('T')[0];
    };
    const daysLater = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0];
    };
    const isoNow = now.toISOString();

    const seedProposals: Proposal[] = [
      {
        id: 'p-001',
        communityName: '阳光花园小区',
        buildingNumber: '3号楼',
        totalFloors: 7,
        unitsCount: 2,
        householdsPerUnit: 2,
        totalHouseholds: 28,
        estimatedTotalCost: 580000,
        elevatorPlan: '钢结构观光电梯 630kg/8人 1.0m/s 品牌：康力',
        estimatedDuration: 120,
        initiator: '阳光花园业委会（张主任）',
        status: 'voting',
        votingStartDate: daysAgo(3),
        votingEndDate: daysLater(12),
        createdAt: isoNow,
      },
      {
        id: 'p-002',
        communityName: '翠湖家园',
        buildingNumber: '5号楼',
        totalFloors: 6,
        unitsCount: 1,
        householdsPerUnit: 3,
        totalHouseholds: 18,
        estimatedTotalCost: 465000,
        elevatorPlan: '混凝土井道电梯 800kg/10人 1.0m/s 品牌：三菱',
        estimatedDuration: 150,
        initiator: '翠湖家园5号楼业主代表（李女士）',
        status: 'public_notice',
        votingStartDate: daysAgo(20),
        votingEndDate: daysAgo(5),
        createdAt: isoNow,
      },
      {
        id: 'p-003',
        communityName: '建设北路128号院',
        buildingNumber: '2号楼',
        totalFloors: 8,
        unitsCount: 3,
        householdsPerUnit: 2,
        totalHouseholds: 48,
        estimatedTotalCost: 720000,
        elevatorPlan: '双单元对称外挂钢结构 1000kg/13人 品牌：日立',
        estimatedDuration: 180,
        initiator: '128号院自治管理小组',
        status: 'construction',
        votingStartDate: daysAgo(90),
        votingEndDate: daysAgo(75),
        createdAt: isoNow,
      },
      {
        id: 'p-004',
        communityName: '书香门第',
        buildingNumber: '8号楼',
        totalFloors: 5,
        unitsCount: 2,
        householdsPerUnit: 2,
        totalHouseholds: 20,
        estimatedTotalCost: 420000,
        elevatorPlan: '钢结构一体化电梯 630kg/8人 1.0m/s 品牌：江南嘉捷',
        estimatedDuration: 90,
        initiator: '书香门第物业',
        status: 'completed',
        votingStartDate: daysAgo(200),
        votingEndDate: daysAgo(185),
        createdAt: isoNow,
      },
      {
        id: 'p-005',
        communityName: '民安社区',
        buildingNumber: '11号楼',
        totalFloors: 6,
        unitsCount: 2,
        householdsPerUnit: 2,
        totalHouseholds: 24,
        estimatedTotalCost: 500000,
        elevatorPlan: '无机房观光电梯 800kg/10人 品牌：迅达',
        estimatedDuration: 110,
        initiator: '民安社区居委会',
        status: 'rejected',
        votingStartDate: daysAgo(60),
        votingEndDate: daysAgo(45),
        createdAt: isoNow,
      },
    ];

    for (const p of seedProposals) {
      this.proposals.push(p);
      this.households.set(p.id, generateHouseholds(p));

      const nodes = generateProgressNodes(p.id).map((n, i) => ({
        ...n,
        id: `${p.id}-node-${i}`,
      }));

      if (p.status === 'construction') {
        nodes[0].status = 'completed';
        nodes[0].startDate = daysAgo(65);
        nodes[0].endDate = daysAgo(50);
        nodes[1].status = 'completed';
        nodes[1].startDate = daysAgo(48);
        nodes[1].endDate = daysAgo(20);
        nodes[2].status = 'in_progress';
        nodes[2].startDate = daysAgo(18);
      } else if (p.status === 'completed') {
        nodes.forEach((n, i) => {
          n.status = 'completed';
          const offset = 180 - i * 25;
          n.startDate = daysAgo(offset);
          n.endDate = daysAgo(offset - 20);
        });
      }
      this.progressNodes.set(p.id, nodes);

      if (p.status === 'construction' || p.status === 'completed') {
        const finances: FinanceRecord[] = [
          {
            id: `${p.id}-f-1`,
            proposalId: p.id,
            category: 'design',
            categoryName: '勘测设计费',
            description: '方案设计+图纸审查+地质勘测',
            budgetAmount: 35000,
            actualAmount: 34500,
            expenseDate: daysAgo(70),
          },
          {
            id: `${p.id}-f-2`,
            proposalId: p.id,
            category: 'construction',
            categoryName: '土建施工费',
            description: '地基基础+钢结构井道+土建配合',
            budgetAmount: Math.round(p.estimatedTotalCost * 0.35),
            actualAmount:
              p.status === 'completed'
                ? Math.round(p.estimatedTotalCost * 0.345)
                : Math.round(p.estimatedTotalCost * 0.3),
            expenseDate: daysAgo(45),
          },
          {
            id: `${p.id}-f-3`,
            proposalId: p.id,
            category: 'equipment',
            categoryName: '电梯设备费',
            description: '电梯主机+轿厢+门机+控制系统',
            budgetAmount: Math.round(p.estimatedTotalCost * 0.48),
            actualAmount:
              p.status === 'completed' ? Math.round(p.estimatedTotalCost * 0.49) : 0,
            expenseDate: p.status === 'completed' ? daysAgo(15) : '',
          },
          {
            id: `${p.id}-f-4`,
            proposalId: p.id,
            category: 'inspection',
            categoryName: '验收检测费',
            description: '特检院检测+质监备案+验收评审',
            budgetAmount: 18000,
            actualAmount: p.status === 'completed' ? 17800 : 0,
            expenseDate: p.status === 'completed' ? daysAgo(3) : '',
          },
        ];
        this.financeRecords.set(p.id, finances);
      } else {
        this.financeRecords.set(p.id, []);
      }

      const hh = this.households.get(p.id) || [];
      const seedVotes = (ratio: { agree: number; disagree: number; abstain: number }) => {
        const totalVotes = Math.max(
          1,
          Math.floor(hh.length * (ratio.agree + ratio.disagree + ratio.abstain))
        );
        for (let i = 0; i < totalVotes; i++) {
          const h = hh[i % hh.length];
          let opt: VoteRecord['option'];
          const r = Math.random();
          if (r < ratio.agree / (ratio.agree + ratio.disagree + ratio.abstain)) {
            opt = 'agree';
          } else if (
            r <
            (ratio.agree + ratio.disagree) /
              (ratio.agree + ratio.disagree + ratio.abstain)
          ) {
            opt = 'disagree';
          } else {
            opt = 'abstain';
          }
          if (!this.votes.find((v) => v.proposalId === p.id && v.householdId === h.id)) {
            this.votes.push({
              id: genId('vote'),
              proposalId: p.id,
              householdId: h.id,
              option: opt,
              weight: h.floorCoefficient,
              votedAt: new Date(now.getTime() - Math.random() * 86400000 * 10).toISOString(),
            });
          }
        }
      };

      if (p.id === 'p-001') seedVotes({ agree: 0.35, disagree: 0.1, abstain: 0.05 });
      if (p.id === 'p-002') seedVotes({ agree: 0.7, disagree: 0.15, abstain: 0.1 });
      if (p.id === 'p-003') seedVotes({ agree: 0.78, disagree: 0.12, abstain: 0.08 });
      if (p.id === 'p-004') seedVotes({ agree: 0.85, disagree: 0.08, abstain: 0.05 });
      if (p.id === 'p-005') seedVotes({ agree: 0.35, disagree: 0.45, abstain: 0.1 });

      if (p.id === 'p-002' && hh.length > 3) {
        this.appeals.push({
          id: genId('appeal'),
          proposalId: p.id,
          householdId: hh[2].id,
          reason: '本人未收到投票通知，属于遗漏登记，请求补充投票权。',
          status: 'pending',
          createdAt: isoNow,
        });
      }
    }
  }

  getProposals(params?: { status?: string; search?: string }): Proposal[] {
    let list = [...this.proposals];
    if (params?.status && params.status !== 'all') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params?.search) {
      const kw = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.communityName.toLowerCase().includes(kw) ||
          p.buildingNumber.toLowerCase().includes(kw)
      );
    }
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getProposal(id: string): Proposal | undefined {
    return this.proposals.find((p) => p.id === id);
  }

  createProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'totalHouseholds' | 'status'>): Proposal {
    const total = data.totalFloors * data.unitsCount * data.householdsPerUnit;
    const p: Proposal = {
      ...data,
      id: genId('p'),
      status: 'voting',
      totalHouseholds: total,
      createdAt: new Date().toISOString(),
    };
    this.proposals.push(p);
    this.households.set(p.id, generateHouseholds(p));
    const nodes = generateProgressNodes(p.id).map((n, i) => ({
      ...n,
      id: `${p.id}-node-${i}`,
    }));
    this.progressNodes.set(p.id, nodes as ProgressNode[]);
    this.financeRecords.set(p.id, []);
    return p;
  }

  getHouseholds(proposalId: string): Household[] {
    return this.households.get(proposalId) || [];
  }

  getFeeEstimate(proposalId: string) {
    const p = this.getProposal(proposalId);
    const hh = this.getHouseholds(proposalId);
    if (!p) return null;
    const items = calcFeeDistribution(p, hh);
    return {
      proposalId,
      estimatedTotalCost: p.estimatedTotalCost,
      totalWeightFactor: items.reduce((s, i) => s + i.weightFactor, 0),
      items,
    };
  }

  submitVote(data: Omit<VoteRecord, 'id' | 'votedAt'>): VoteRecord | { error: string } {
    const existing = this.votes.find(
      (v) => v.proposalId === data.proposalId && v.householdId === data.householdId
    );
    if (existing) return { error: '该住户已经投过票' };
    const p = this.getProposal(data.proposalId);
    if (!p) return { error: '提案不存在' };
    if (p.status !== 'voting') return { error: '当前状态不可投票' };
    const vote: VoteRecord = {
      ...data,
      id: genId('vote'),
      votedAt: new Date().toISOString(),
    };
    this.votes.push(vote);
    return vote;
  }

  getVotes(proposalId: string): VoteRecord[] {
    return this.votes.filter((v) => v.proposalId === proposalId);
  }

  hasVoted(proposalId: string, householdId: string): VoteRecord | undefined {
    return this.votes.find((v) => v.proposalId === proposalId && v.householdId === householdId);
  }

  getVoteResult(proposalId: string) {
    const p = this.getProposal(proposalId);
    if (!p) return null;
    const votes = this.getVotes(proposalId);
    return calcWeightedVoteResult(votes, p.totalHouseholds);
  }

  submitAppeal(data: Omit<Appeal, 'id' | 'createdAt' | 'status'>): Appeal {
    const a: Appeal = {
      ...data,
      id: genId('appeal'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.appeals.push(a);
    return a;
  }

  getAppeals(proposalId: string): Appeal[] {
    return this.appeals.filter((a) => a.proposalId === proposalId);
  }

  getProgressNodes(proposalId: string): ProgressNode[] {
    return [...(this.progressNodes.get(proposalId) || [])].sort(
      (a, b) => a.stepIndex - b.stepIndex
    );
  }

  updateProgressNode(
    proposalId: string,
    nodeId: string,
    patch: Partial<Pick<ProgressNode, 'status' | 'startDate' | 'endDate'>>
  ): ProgressNode | undefined {
    const list = this.progressNodes.get(proposalId);
    if (!list) return undefined;
    const n = list.find((x) => x.id === nodeId);
    if (!n) return undefined;
    Object.assign(n, patch);
    return n;
  }

  getFinances(proposalId: string): FinanceRecord[] {
    return this.financeRecords.get(proposalId) || [];
  }

  addFinance(
    data: Omit<FinanceRecord, 'id'>
  ): FinanceRecord {
    const r: FinanceRecord = { ...data, id: genId('f') };
    const list = this.financeRecords.get(data.proposalId) || [];
    list.push(r);
    this.financeRecords.set(data.proposalId, list);
    return r;
  }
}

export const db = new DataStore();
export default db;
