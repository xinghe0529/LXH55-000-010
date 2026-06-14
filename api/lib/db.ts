import type {
  Proposal,
  Household,
  VoteRecord,
  Appeal,
  ProgressNode,
  FinanceRecord,
  ConstructionDailyReport,
  Notification,
  NotificationType,
  NotificationPriority,
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
  private dailyReports: Map<string, ConstructionDailyReport[]> = new Map();
  private notifications: Notification[] = [];

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

      if (p.status === 'construction') {
        const nodes = this.progressNodes.get(p.id) || [];
        const inProgressNode = nodes.find((n) => n.status === 'in_progress');
        const seedReports: ConstructionDailyReport[] = [];
        for (let i = 0; i < 15; i++) {
          const reportDate = daysAgo(18 - i);
          const weatherOptions = ['晴', '多云', '阴', '小雨'];
          const weather = weatherOptions[i % weatherOptions.length];
          const contents = [
            '今日进行地基钢筋绑扎作业，完成总量的60%',
            '继续地基混凝土浇筑，使用C30商砼25立方',
            '地基养护作业，洒水覆盖保温膜',
            '钢结构构件进场验收，检查焊缝质量',
            '开始钢立柱吊装作业，共完成3根立柱',
            '钢立柱焊接加固，检测垂直度偏差',
            '横梁安装作业，完成首层横梁安装',
            '二层钢结构安装，高强度螺栓紧固',
            '三层钢结构安装，焊缝探伤检测',
            '玻璃幕墙龙骨安装，测量定位放线',
            '幕墙玻璃吊装，密封胶打缝处理',
            '电梯导轨支架安装，基准线放线',
            '电梯导轨安装，调整垂直度',
            '轿厢缓冲器安装，底坑清理',
            '脚手架拆除作业，现场安全防护',
          ];
          const progresses = [
            '地基施工阶段，整体进度15%',
            '地基施工阶段，整体进度25%',
            '地基施工阶段，整体进度30%',
            '地基养护完成，准备钢结构施工',
            '钢结构施工阶段，整体进度35%',
            '钢结构施工阶段，整体进度40%',
            '钢结构施工阶段，整体进度48%',
            '钢结构施工阶段，整体进度55%',
            '钢结构施工阶段，整体进度62%',
            '幕墙施工阶段，整体进度68%',
            '幕墙施工阶段，整体进度75%',
            '电梯安装阶段，整体进度80%',
            '电梯安装阶段，整体进度85%',
            '电梯安装阶段，整体进度88%',
            '电梯安装阶段，整体进度90%',
          ];
          const photoUrls = [
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?w=800&h=600&fit=crop',
          ];
          const nextPlans = [
            '明日继续钢筋绑扎，计划完成剩余40%',
            '明日进行混凝土养护，检查强度',
            '明日组织钢结构进场验收',
            '明日开始钢立柱吊装准备工作',
            '明日继续剩余钢立柱吊装',
            '明日进行焊缝质量检测',
            '明日开始二层横梁安装',
            '明日进行三层钢结构安装',
            '明日开始幕墙龙骨安装准备',
            '明日继续幕墙龙骨安装',
            '明日进行玻璃打胶养护',
            '明日开始电梯导轨安装',
            '明日继续导轨调整作业',
            '明日开始轿厢组装',
            '明日进行脚手架拆除收尾',
          ];
          seedReports.push({
            id: `${p.id}-report-${i}`,
            proposalId: p.id,
            progressNodeId: inProgressNode?.id,
            reportDate,
            weather,
            temperature: `${18 + (i % 10)}°C`,
            constructionContent: contents[i],
            constructionProgress: progresses[i],
            workerCount: 6 + (i % 4),
            materials: i % 3 === 0 ? '钢筋2吨，混凝土30立方' : i % 3 === 1 ? '钢结构构件5件' : '玻璃幕墙6块，密封胶20支',
            issues: i === 5 ? '昨日进场的部分螺栓规格不符，已联系供应商更换' : i === 10 ? '因小雨影响，上午施工延迟2小时' : undefined,
            nextPlan: nextPlans[i],
            photos: [
              { url: photoUrls[i % photoUrls.length], description: '施工现场全景' },
              { url: photoUrls[(i + 1) % photoUrls.length], description: '施工作业特写' },
            ],
            reporter: '施工队 李队长',
            createdAt: isoNow,
            updatedAt: isoNow,
          });
        }
        this.dailyReports.set(p.id, seedReports);
      } else {
        this.dailyReports.set(p.id, []);
      }
    }

    this.seedMockNotifications(isoNow);
  }

  private seedMockNotifications(isoNow: string) {
    const allProposals = this.proposals;
    const seedData: Array<{
      proposalId: string;
      type: NotificationType;
      priority: NotificationPriority;
      title: string;
      content: string;
      recipientIds?: string[];
    }> = [];

    for (const p of allProposals) {
      const hh = this.households.get(p.id) || [];

      if (p.status === 'public_notice' || p.status === 'approved' || p.status === 'construction' || p.status === 'completed' || p.status === 'rejected') {
        seedData.push({
          proposalId: p.id,
          type: 'vote_result',
          priority: p.status === 'rejected' ? 'high' : 'medium',
          title: `${p.communityName}${p.buildingNumber}投票结果出炉`,
          content: p.status === 'rejected'
            ? '很遗憾，本次加装电梯投票未通过。感谢您的参与！'
            : p.status === 'completed'
            ? '电梯加装项目已顺利完工并交付使用！'
            : '投票已通过，项目即将进入下一阶段。',
        });
      }

      const nodes = this.progressNodes.get(p.id) || [];
      const completedNodes = nodes.filter((n) => n.status === 'completed');
      if (completedNodes.length > 0) {
        const lastCompleted = completedNodes[completedNodes.length - 1];
        seedData.push({
          proposalId: p.id,
          type: 'progress_node',
          priority: 'medium',
          title: `${p.communityName}${p.buildingNumber}施工进度更新`,
          content: `「${lastCompleted.title}」阶段已完成！点击查看详情。`,
        });
      }

      if ((p.status === 'construction' || p.status === 'completed') && hh.length > 0) {
        const feeData = this.getFeeEstimate(p.id);
        if (feeData) {
          const targetHousehold = hh[Math.floor(hh.length / 2)];
          const feeItem = feeData.items.find((i) => i.householdId === targetHousehold.id);
          seedData.push({
            proposalId: p.id,
            type: 'payment_reminder',
            priority: 'high',
            title: `${p.communityName}${p.buildingNumber}资金催缴通知`,
            content: `尊敬的业主，您需分摊费用约${feeItem ? Math.round(feeItem.estimatedFee).toLocaleString() : '0'}元，请及时缴纳。`,
            recipientIds: [targetHousehold.id],
          });
        }
      }
    }

    for (const s of seedData.slice(0, 6)) {
      const hh = this.households.get(s.proposalId) || [];
      const recipientIds = s.recipientIds && s.recipientIds.length > 0
        ? s.recipientIds
        : hh.map((h) => h.id);
      this.notifications.push({
        id: genId('notif'),
        type: s.type,
        priority: s.priority,
        recipientType: s.recipientIds && s.recipientIds.length > 0 ? 'household' : 'all',
        recipientIds,
        proposalId: s.proposalId,
        title: s.title,
        content: s.content,
        createdAt: new Date(new Date(isoNow).getTime() - Math.random() * 86400000 * 5).toISOString(),
        readBy: [],
      });
    }
  }

  createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'readBy'>): Notification {
    const n: Notification = {
      ...data,
      id: genId('notif'),
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    this.notifications.push(n);
    return n;
  }

  getNotifications(params: { householdId?: string; proposalId?: string; unreadOnly?: boolean; limit?: number }): Notification[] {
    let list = [...this.notifications];
    if (params.householdId) {
      list = list.filter((n) => n.recipientType === 'all' || n.recipientIds.includes(params.householdId!));
    }
    if (params.proposalId) {
      list = list.filter((n) => n.proposalId === params.proposalId);
    }
    if (params.unreadOnly && params.householdId) {
      list = list.filter((n) => !n.readBy.includes(params.householdId!));
    }
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (params.limit) list = list.slice(0, params.limit);
    return list;
  }

  getUnreadCount(householdId: string, proposalId?: string): number {
    return this.getNotifications({ householdId, proposalId, unreadOnly: true }).length;
  }

  markAsRead(notificationId: string, householdId: string): boolean {
    const n = this.notifications.find((x) => x.id === notificationId);
    if (!n) return false;
    if (!n.readBy.includes(householdId)) {
      n.readBy.push(householdId);
    }
    return true;
  }

  markAllAsRead(householdId: string, proposalId?: string): number {
    const list = this.getNotifications({ householdId, proposalId, unreadOnly: true });
    let count = 0;
    for (const n of list) {
      if (!n.readBy.includes(householdId)) {
        n.readBy.push(householdId);
        count++;
      }
    }
    return count;
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
    this.dailyReports.set(p.id, []);
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

  getDailyReports(proposalId: string, params?: { progressNodeId?: string; startDate?: string; endDate?: string }): ConstructionDailyReport[] {
    let list = [...(this.dailyReports.get(proposalId) || [])];
    if (params?.progressNodeId) {
      list = list.filter((r) => r.progressNodeId === params.progressNodeId);
    }
    if (params?.startDate) {
      list = list.filter((r) => r.reportDate >= params.startDate!);
    }
    if (params?.endDate) {
      list = list.filter((r) => r.reportDate <= params.endDate!);
    }
    return list.sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }

  getDailyReport(proposalId: string, reportId: string): ConstructionDailyReport | undefined {
    const list = this.dailyReports.get(proposalId) || [];
    return list.find((r) => r.id === reportId);
  }

  addDailyReport(
    data: Omit<ConstructionDailyReport, 'id' | 'createdAt' | 'updatedAt'>
  ): ConstructionDailyReport {
    const now = new Date().toISOString();
    const r: ConstructionDailyReport = {
      ...data,
      id: genId('report'),
      createdAt: now,
      updatedAt: now,
    };
    const list = this.dailyReports.get(data.proposalId) || [];
    list.push(r);
    this.dailyReports.set(data.proposalId, list);
    return r;
  }

  updateDailyReport(
    proposalId: string,
    reportId: string,
    patch: Partial<Omit<ConstructionDailyReport, 'id' | 'proposalId' | 'createdAt'>>
  ): ConstructionDailyReport | undefined {
    const list = this.dailyReports.get(proposalId);
    if (!list) return undefined;
    const r = list.find((x) => x.id === reportId);
    if (!r) return undefined;
    Object.assign(r, patch, { updatedAt: new Date().toISOString() });
    return r;
  }

  deleteDailyReport(proposalId: string, reportId: string): boolean {
    const list = this.dailyReports.get(proposalId);
    if (!list) return false;
    const idx = list.findIndex((x) => x.id === reportId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.dailyReports.set(proposalId, list);
    return true;
  }
}

export const db = new DataStore();
export default db;
