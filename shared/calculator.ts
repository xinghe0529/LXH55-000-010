import type { Household, Proposal, FeeEstimateItem, VoteRecord, VoteResult } from './types';

export function calcFloorCoefficient(floor: number): number {
  if (floor <= 2) return 0.05;
  return 1.0 + (floor - 3) * 0.1;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcFeeDistribution(
  proposal: Proposal,
  households: Household[]
): FeeEstimateItem[] {
  const items: Omit<FeeEstimateItem, 'estimatedFee' | 'percentage'>[] = households.map((h) => {
    const coeff = calcFloorCoefficient(h.floor);
    return {
      householdId: h.id,
      floor: h.floor,
      roomNumber: h.roomNumber,
      area: h.area,
      floorCoefficient: coeff,
      weightFactor: coeff * h.area,
    };
  });

  const totalWeight = items.reduce((sum, it) => sum + it.weightFactor, 0);

  return items
    .map((it) => {
      const percentage = totalWeight > 0 ? it.weightFactor / totalWeight : 0;
      return {
        ...it,
        estimatedFee: Math.round(proposal.estimatedTotalCost * percentage),
        percentage: percentage * 100,
      };
    })
    .sort((a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber));
}

export function calcWeightedVoteResult(
  votes: VoteRecord[],
  totalHouseholds: number
): VoteResult {
  let agreeCount = 0;
  let disagreeCount = 0;
  let abstainCount = 0;
  let weightedAgree = 0;
  let weightedDisagree = 0;
  let weightedAbstain = 0;

  for (const vote of votes) {
    if (vote.option === 'agree') {
      agreeCount++;
      weightedAgree += vote.weight;
    } else if (vote.option === 'disagree') {
      disagreeCount++;
      weightedDisagree += vote.weight;
    } else {
      abstainCount++;
      weightedAbstain += vote.weight;
    }
  }

  const votedCount = votes.length;
  const votingRate = totalHouseholds > 0 ? (votedCount / totalHouseholds) * 100 : 0;
  const totalWeighted = weightedAgree + weightedDisagree;
  const weightedAgreeRate = totalWeighted > 0 ? (weightedAgree / totalWeighted) * 100 : 0;
  const passed = weightedAgreeRate >= 66.67 && votingRate >= 50;

  return {
    totalHouseholds,
    votedCount,
    votingRate,
    agreeCount,
    disagreeCount,
    abstainCount,
    weightedAgree: +weightedAgree.toFixed(2),
    weightedDisagree: +weightedDisagree.toFixed(2),
    weightedAbstain: +weightedAbstain.toFixed(2),
    weightedAgreeRate: +weightedAgreeRate.toFixed(2),
    passed,
  };
}

export function generateHouseholds(proposal: {
  id: string;
  buildingNumber: string;
  totalFloors: number;
  unitsCount: number;
  householdsPerUnit: number;
}): Household[] {
  const households: Household[] = [];
  const baseAreas = [58, 68, 75, 82, 95, 108, 120];

  for (let u = 1; u <= proposal.unitsCount; u++) {
    for (let f = 1; f <= proposal.totalFloors; f++) {
      for (let r = 1; r <= proposal.householdsPerUnit; r++) {
        const roomSeed = (f * 13 + u * 7 + r * 5) % baseAreas.length;
        households.push({
          id: `${proposal.id}-${u}-${f}-${r}`,
          proposalId: proposal.id,
          building: proposal.buildingNumber,
          unit: String(u),
          floor: f,
          roomNumber: `${f}0${r}`,
          area: baseAreas[roomSeed],
          floorCoefficient: calcFloorCoefficient(f),
        });
      }
    }
  }
  return households;
}

export function generateProgressNodes(proposalId: string): Omit<import('./types').ProgressNode, 'id'>[] {
  return [
    {
      proposalId,
      stepIndex: 0,
      title: '勘测设计阶段',
      description: '现场勘测、方案设计、图纸审查、规划公示',
      status: 'pending',
      responsible: '设计院 王工',
    },
    {
      proposalId,
      stepIndex: 1,
      title: '基础施工阶段',
      description: '地基开挖、钢筋绑扎、混凝土浇筑、养护检测',
      status: 'pending',
      responsible: '施工队 李队',
    },
    {
      proposalId,
      stepIndex: 2,
      title: '钢结构井道',
      description: '钢构件进场、立柱焊接、横梁安装、玻璃幕墙',
      status: 'pending',
      responsible: '钢构厂 赵工',
    },
    {
      proposalId,
      stepIndex: 3,
      title: '电梯设备安装',
      description: '导轨安装、轿厢组装、曳引机固定、门机系统',
      status: 'pending',
      responsible: '电梯厂 钱工',
    },
    {
      proposalId,
      stepIndex: 4,
      title: '调试与验收',
      description: '电气调试、安全检测、特检验收、质监备案',
      status: 'pending',
      responsible: '特检院 孙工',
    },
    {
      proposalId,
      stepIndex: 5,
      title: '移交使用',
      description: '物业交接、使用培训、质保协议、资料归档',
      status: 'pending',
      responsible: '物业公司 周经理',
    },
  ];
}

export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
