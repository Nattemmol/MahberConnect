import { delay, randomError } from '../utils';
import { mockPayments, mockTransactions } from '../data/financial';
import { InitiatePaymentDto } from '@/lib/types';
import { mockFines } from '../data/fines';
import { mockLotteryDraws } from '../data/lottery';
import { mockUsers } from '../data/users';
import { mockMahbers } from '../data/mahbers';

let fines = [...mockFines];
let lotteryDraws = [...mockLotteryDraws];

export const financialMock = {
  payRecurring: async (id: string) => {
    await delay(1000);
    randomError(0.05);

    const tx_ref = `tx_contrib_${Date.now()}`;
    const mockCheckoutUrl = `/payment/callback?tx_ref=${tx_ref}&status=success`;
    const mahber = mockMahbers.find(m => m.id === id);
    const contributionAmount = mahber?.configuration?.contribution_amount ?? 500;

    mockPayments.push({
      id: `pay_${Math.random()}`,
      user_id: 'usr_1',
      mahber_id: id,
      amount: contributionAmount,
      payment_type: 'Contribution',
      status: 'Pending',
      tx_ref: tx_ref,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      checkout_url: mockCheckoutUrl,
      payment_id: tx_ref
    };
  },

  initiatePayment: async (data: InitiatePaymentDto) => {
    await delay(1200);
    randomError(0.05);
    
    const tx_ref = `tx_mock_${Date.now()}`;
    
    // In a real app, Chapa redirects here. 
    // We will simulate the Chapa checkout page by redirecting to our own mock callback URL
    const mockCheckoutUrl = `/payment/callback?tx_ref=${tx_ref}&status=success`;

    // Temporarily store it in our mock data as pending
    mockPayments.push({
      id: `pay_${Math.random()}`,
      user_id: 'usr_1',
      mahber_id: data.mahber_id,
      amount: data.amount,
      payment_type: data.payment_type,
      status: 'Pending',
      tx_ref: tx_ref,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return { checkoutUrl: mockCheckoutUrl, tx_ref };
  },

  verifyPayment: async (tx_ref: string) => {
    await delay(800);
    const payment = mockPayments.find(p => p.tx_ref === tx_ref);
    if (!payment) throw new Error('Payment not found');
    
    // Simulate successful verification
    payment.status = 'Completed';
    return payment;
  },
  
  getMahberPayments: async (mahberId: string) => {
    await delay(600);
    const data = mockPayments.filter(p => p.mahber_id === mahberId);
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 }
    };
  },

  getMahberLedger: async (mahberId: string) => {
    await delay(600);
    const data = mockTransactions.filter(t => t.mahber_id === mahberId);
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 }
    };
  },

  getWallet: async (id: string, params?: { memberId?: string; page?: number; limit?: number }) => {
    await delay(600);
    const relevantPayments = mockPayments.filter(p => p.mahber_id === id && p.status === 'Completed');
    
    const initialEntries = [
      {
        id: "ledger-entry-1",
        mahber_id: id,
        member_id: params?.memberId || "usr_1",
        transaction_type: "Contribution",
        amount: "5000.00",
        running_balance: "5000.00",
        payment_id: "pay_1",
        fine_id: null,
        lottery_id: null,
        description: "Contribution payment via Chapa callback (tx_ref: tx_mock_123)",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: "ledger-entry-2",
        mahber_id: id,
        member_id: params?.memberId || "usr_1",
        transaction_type: "Fine",
        amount: "-250.00",
        running_balance: "4750.00",
        payment_id: null,
        fine_id: "fine-uuid",
        lottery_id: null,
        description: "Missed contribution payment (frequency: Monthly)",
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];

    let currentBalance = 4750;
    
    relevantPayments.forEach((p) => {
      if (p.id !== 'pay_1') {
        currentBalance += p.amount;
        initialEntries.unshift({
          id: `ledger-entry-pay-${p.id}`,
          mahber_id: id,
          member_id: p.user_id,
          transaction_type: p.payment_type === 'JoinFee' ? 'JoinFee' : 'Contribution',
          amount: p.amount.toFixed(2),
          running_balance: currentBalance.toFixed(2),
          payment_id: p.id,
          fine_id: null,
          lottery_id: null,
          description: `${p.payment_type} payment via Chapa callback (tx_ref: ${p.tx_ref})`,
          created_at: p.created_at
        });
      }
    });

    let filteredEntries = initialEntries;
    if (params?.memberId) {
      filteredEntries = initialEntries.filter(e => e.member_id === params.memberId);
    }

    return {
      entries: filteredEntries,
      balance: currentBalance.toFixed(2)
    };
  },

  // Fines
  getFines: async (mahberId: string) => {
    await delay(500);
    const data = fines.filter(f => f.mahber_id === mahberId);
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 }
    };
  },
  
  waiveFine: async (mahberId: string, fineId: string) => {
    await delay(600);
    const fineIndex = fines.findIndex(f => f.id === fineId && f.mahber_id === mahberId);
    if (fineIndex === -1) throw new Error('Fine not found');
    
    const updatedFine = { 
      ...fines[fineIndex], 
      status: 'waived' as const, 
      resolved_at: new Date().toISOString() 
    };
    fines[fineIndex] = updatedFine;
    return updatedFine;
  },

  // Lottery
  getLotteryHistory: async (mahberId: string) => {
    await delay(700);
    return lotteryDraws
      .filter(l => l.mahber_id === mahberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  executeLottery: async (mahberId: string, data?: { operationalCostRate?: number; fineThreshold?: number }) => {
    await delay(2000); // Simulate suspense of draw
    randomError(0.05);

    // Get members who haven't won yet
    const pastWinners = lotteryDraws.filter(l => l.mahber_id === mahberId).map(l => l.winner_id);
    const eligibleMembers = mockUsers.filter(u => !pastWinners.includes(u.id));

    if (eligibleMembers.length === 0) {
      throw new Error('All members have won. The Equb cycle is complete!');
    }

    // Pick random winner
    const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
    const cycle_number = lotteryDraws.filter(l => l.mahber_id === mahberId).length + 1;

    const newDraw: any = {
      id: `draw_${Date.now()}`,
      mahber_id: mahberId,
      cycle_number,
      winner_id: winner.id,
      eligible_members: eligibleMembers.map(u => u.id),
      random_seed: Math.random().toString(36).substring(7),
      payout_amount: 50000, // Mock fixed payout
      created_at: new Date().toISOString(),
      winner
    };

    lotteryDraws = [newDraw, ...lotteryDraws];
    return newDraw;
  }
};
