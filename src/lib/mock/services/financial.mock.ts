import { delay, randomError, paginate } from '../utils';
import { mockPayments, mockTransactions, mockExpenses } from '../data/financial';
import { InitiatePaymentDto, PaymentQueryParams, CreateExpenseDto, CreatePayoutDto, Bank, Expense, Payout, PayoutCategory, PayoutSummary, PayoutStatus, ApprovePayoutResponse, LotteryDraw } from '@/lib/types';
import { mockFines } from '../data/fines';
import { mockLotteryDraws } from '../data/lottery';
import { mockUsers } from '../data/users';
import { mockMahbers } from '../data/mahbers';
import { mockMemberDetails } from '../data/memberships';

let fines = [...mockFines];
let lotteryDraws = [...mockLotteryDraws];
let expenses = [...mockExpenses];

let mockPayouts: Payout[] = [
  {
    id: 'pout_1',
    mahber_id: 'mahber_1',
    member_id: 'usr_2',
    amount: 3000,
    category: 'Iddir_Benefit',
    reason: 'Bereavement support for member family',
    status: 'PAID',
    approved_by: 'usr_1',
    approved_by_admin: 'usr_1',
    approved_by_treasurer: 'usr_1',
    paid_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    member: mockUsers[1] ?? { id: 'usr_2', name: 'Sara Tadesse', phone: '+251922345678', created_at: '', updated_at: '' },
  },
  {
    id: 'pout_2',
    mahber_id: 'mahber_1',
    member_id: 'usr_3',
    amount: 1500,
    category: 'Event_Reimbursement',
    reason: 'Reimbursement for event supplies',
    status: 'PAID',
    approved_by: 'usr_1',
    approved_by_admin: 'usr_1',
    approved_by_treasurer: 'usr_1',
    paid_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    member: mockUsers[2] ?? { id: 'usr_3', name: 'Yonas Alemu', phone: '+251933456789', created_at: '', updated_at: '' },
  },
];

export const financialMock = {
  getOutstanding: async (mahberId: string) => {
    await delay(400);

    const mahber = mockMahbers.find((m) => m.id === mahberId);
    const currentMember = mockMemberDetails.find((m) => m.mahber_id === mahberId && m.member_id === 'usr_1');
    const contributionAmount = mahber?.configuration?.contribution_amount ?? 500;
    const pendingFines = fines.filter((f) => f.mahber_id === mahberId && f.member_id === 'usr_1' && !f.is_waived && !f.paid_at).map((f) => ({
      id: f.id,
      amount: Number(f.amount),
      reason: f.violation_type === 'MISSED_ATTENDANCE' ? 'Missed attendance' : 'Missed payment',
      issued_at: f.created_at,
    }));
    const hasPendingPayment = mockPayments.some((p) => p.mahber_id === mahberId && p.member_id === 'usr_1' && p.status === 'Pending');

    const contributionDueDate = currentMember?.next_payment_due ? new Date(currentMember.next_payment_due) : null;
    const contributionDue =
      currentMember?.status === 'Active' &&
      contributionDueDate !== null &&
      contributionDueDate.getTime() <= Date.now();
    const pendingPayment = mockPayments.find((p) => p.mahber_id === mahberId && p.member_id === 'usr_1' && p.status === 'Pending');

    return {
      contribution_due: contributionDue ? contributionAmount : null,
      contribution_due_date: contributionDue ? currentMember?.next_payment_due ?? null : null,
      pending_fines: pendingFines,
      total_outstanding: pendingFines.reduce((sum, fine) => sum + fine.amount, 0) + (contributionDue ? contributionAmount : 0),
      has_pending_payment: hasPendingPayment,
      pending_payment_id: pendingPayment?.id,
      pending_payment_amount: pendingPayment ? Number(pendingPayment.amount) : undefined,
      pending_payment_type: pendingPayment?.payment_type,
    };
  },

  payRecurring: async (id: string) => {
    await delay(1000);
    randomError(0.05);

    const tx_ref = `tx_contrib_${Date.now()}`;
    const mockCheckoutUrl = `/payment/callback?tx_ref=${tx_ref}&status=success`;
    const mahber = mockMahbers.find(m => m.id === id);
    const contributionAmount = mahber?.configuration?.contribution_amount ?? 500;

    mockPayments.push({
      id: `pay_${Math.random()}`,
      member_id: 'usr_1',
      mahber_id: id,
      amount: contributionAmount,
      payment_type: 'Contribution',
      status: 'Pending',
      tx_ref: tx_ref,
      checkout_url: mockCheckoutUrl,
      fine_ids: null,
      period_start: null,
      period_end: null,
      expires_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return {
      checkout_url: mockCheckoutUrl,
      payment_id: tx_ref
    };
  },

  initiatePaymentRound: async (_mahberId: string, _dueDate?: string) => {
    await delay(800);
    randomError(0.05);
    const count = 5;
    return { updatedCount: count, dueDate: _dueDate ?? new Date().toISOString() };
  },

  initiatePayment: async (data: InitiatePaymentDto) => {
    await delay(1200);
    randomError(0.05);

    const outstanding = await financialMock.getOutstanding(data.mahber_id);
    const tx_ref = `tx_mock_${Date.now()}`;

    // In a real app, Chapa redirects here.
    // We will simulate the Chapa checkout page by redirecting to our own mock callback URL
    const mockCheckoutUrl = `/payment/callback?tx_ref=${tx_ref}&status=success`;

    // Temporarily store it in our mock data as pending
    mockPayments.push({
      id: `pay_${Math.random()}`,
      member_id: 'usr_1',
      mahber_id: data.mahber_id,
      amount: outstanding.total_outstanding,
      payment_type: outstanding.contribution_due ? 'Contribution' : 'JoinFee',
      status: 'Pending',
      tx_ref: tx_ref,
      checkout_url: mockCheckoutUrl,
      fine_ids: data.fine_ids ?? outstanding.pending_fines.map((fine) => fine.id),
      period_start: null,
      period_end: null,
      expires_at: null,
      completed_at: null,
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
  
  getMahberPayments: async (mahberId: string, params?: PaymentQueryParams) => {
    await delay(400);

    const { page = 1, limit = 10, search, type, sort = 'date', order = 'desc' } = params || {};

    let filtered = mockPayments.filter(p => p.mahber_id === mahberId);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.tx_ref.toLowerCase().includes(q) ||
          p.payment_type.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.user?.name?.toLowerCase().includes(q) ?? false)
      );
    }

    if (type && type !== 'All') {
      filtered = filtered.filter((p) => p.payment_type === type);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sort === 'date') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sort === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sort === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return order === 'desc' ? -cmp : cmp;
    });

    return paginate(filtered, page, limit);
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
          member_id: p.member_id,
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

  executeLottery: async (mahberId: string, params?: { operationalCostRate?: number; fineThreshold?: number }) => {
    await delay(2000);
    randomError(0.05);

    const mahber = mockMahbers.find((m) => m.id === mahberId);
    if (!mahber) {
      throw new Error("Mahber not found");
    }

    // Check if there's already a pending Equb payout
    const existingPending = mockPayouts.find(
      (p) => p.mahber_id === mahberId && p.category === 'Equb_Payout' && p.status === 'PENDING_APPROVAL'
    );
    if (existingPending) {
      throw new Error("An Equb payout is already pending approval. Resolve it before running a new draw.");
    }

    const activeMembers = mockMemberDetails.filter(
      (member) => member.mahber_id === mahberId && member.status === "Active"
    );

    if (activeMembers.length < 2) {
      throw new Error("At least two active members are required to execute the lottery");
    }

    const winnersThisCycleCount = activeMembers.filter((member) => member.has_won_current_cycle).length;

    const unpaidMembers = activeMembers.filter((member) => {
      const completedContributions = mockPayments.filter(
        (payment) =>
          payment.mahber_id === mahberId &&
          payment.member_id === member.member_id &&
          payment.payment_type === "Contribution" &&
          payment.status === "Completed"
      ).length;
      return completedContributions < winnersThisCycleCount + 1;
    });

    if (unpaidMembers.length > 0) {
      const unpaidNames = unpaidMembers.map((member) => member.user?.name ?? member.member_id).join(", ");
      throw new Error(`Cannot run draw. These members still have unpaid contributions for this round: ${unpaidNames}`);
    }

    // Apply fine threshold exclusion
    let eligibleMembers = activeMembers.filter((member) => !member.has_won_current_cycle);
    if (params?.fineThreshold && params.fineThreshold > 0) {
      eligibleMembers = eligibleMembers.filter((member) => {
        const memberFines = fines.filter(
          (f) => f.mahber_id === mahberId && f.member_id === member.member_id && f.status === 'pending'
        );
        const totalFineAmount = memberFines.reduce((sum, f) => sum + Number(f.amount), 0);
        return totalFineAmount <= params.fineThreshold!;
      });
    }

    if (eligibleMembers.length === 0) {
      activeMembers.forEach((member) => {
        member.has_won_current_cycle = false;
        member.updated_at = new Date().toISOString();
      });
      eligibleMembers = [...activeMembers];
    }

    const winnerMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
    const winner = winnerMember.user ?? mockUsers.find((user) => user.id === winnerMember.member_id);

    if (!winner) {
      throw new Error("Winner profile not found");
    }

    const contributionAmount = mahber.configuration.contribution_amount ?? 0;
    const operationCostRate = params?.operationalCostRate ?? mahber.configuration.operation_cost_rate ?? 0;
    const grossPool = activeMembers.length * contributionAmount;
    const operationCost = grossPool * (operationCostRate / 100);
    const payoutAmount = Math.max(0, grossPool - operationCost);

    winnerMember.has_won_current_cycle = true;
    winnerMember.balance = (Number(winnerMember.balance || 0) + payoutAmount).toFixed(2);
    winnerMember.updated_at = new Date().toISOString();

    const cycle_number = lotteryDraws.filter((l) => l.mahber_id === mahberId).length + 1;

    // Create the pending payout
    const payoutId = `pout_equb_${Date.now()}`;
    const pendingPayout: Payout = {
      id: payoutId,
      mahber_id: mahberId,
      member_id: winnerMember.member_id,
      amount: Number(payoutAmount.toFixed(2)),
      category: 'Equb_Payout',
      reason: `Equb lottery payout - Cycle ${cycle_number}`,
      status: 'PENDING_APPROVAL',
      approved_by: null,
      approved_by_admin: null,
      approved_by_treasurer: null,
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member: winner,
    };
    mockPayouts.unshift(pendingPayout);

    const newDraw: LotteryDraw = {
      id: `draw_${Date.now()}`,
      mahber_id: mahberId,
      cycle_number,
      winner_id: winnerMember.member_id,
      eligible_members: eligibleMembers.map((member) => member.member_id),
      random_seed: Math.random().toString(36).substring(7),
      payout_amount: Number(payoutAmount.toFixed(2)),
      payout_id: payoutId,
      created_at: new Date().toISOString(),
      winner,
    };

    const allMembersWonAfterDraw = activeMembers.every((member) => member.has_won_current_cycle);
    if (allMembersWonAfterDraw) {
      activeMembers.forEach((member) => {
        member.has_won_current_cycle = false;
        member.updated_at = new Date().toISOString();
      });
    }

    lotteryDraws = [newDraw, ...lotteryDraws];
    return newDraw;
  },

  approvePayoutAsAdmin: async (mahberId: string, payoutId: string): Promise<ApprovePayoutResponse> => {
    await delay(600);
    const idx = mockPayouts.findIndex((p) => p.id === payoutId && p.mahber_id === mahberId);
    if (idx === -1) throw new Error('Payout not found');
    const payout = mockPayouts[idx];
    if (payout.status !== 'PENDING_APPROVAL') throw new Error('Payout is not pending approval');
    if (payout.approved_by_admin) throw new Error('Admin already approved this payout');

    payout.approved_by_admin = 'usr_1';
    payout.approved_by = 'usr_1';
    if (payout.approved_by_treasurer) {
      payout.status = 'PAID';
      payout.paid_at = new Date().toISOString();
    }
    payout.updated_at = new Date().toISOString();
    mockPayouts[idx] = payout;

    return {
      id: payout.id,
      status: payout.status,
      approved_by_admin: payout.approved_by_admin,
      approved_by_treasurer: payout.approved_by_treasurer,
      paid_at: payout.paid_at,
    };
  },

  approvePayoutAsTreasurer: async (mahberId: string, payoutId: string): Promise<ApprovePayoutResponse> => {
    await delay(600);
    const idx = mockPayouts.findIndex((p) => p.id === payoutId && p.mahber_id === mahberId);
    if (idx === -1) throw new Error('Payout not found');
    const payout = mockPayouts[idx];
    if (payout.status !== 'PENDING_APPROVAL') throw new Error('Payout is not pending approval');
    if (payout.approved_by_treasurer) throw new Error('Treasurer already approved this payout');

    payout.approved_by_treasurer = 'usr_ Songe'; // Mock treasurer user
    if (payout.approved_by_admin) {
      payout.status = 'PAID';
      payout.paid_at = new Date().toISOString();
    }
    payout.updated_at = new Date().toISOString();
    mockPayouts[idx] = payout;

    return {
      id: payout.id,
      status: payout.status,
      approved_by_admin: payout.approved_by_admin,
      approved_by_treasurer: payout.approved_by_treasurer,
      paid_at: payout.paid_at,
    };
  },

  downloadReceipt: async (_mahberId: string, _paymentId: string): Promise<Blob> => {
    await delay(300);
    const text = `MahberConnect - Digital Receipt\nPayment ID: ${_paymentId}\nThis is a simulated receipt.`;
    return new Blob([text], { type: 'application/pdf' });
  },

  // ── Chapa Banks ─────────────────────────────────────────────────────────
  getBanks: async (): Promise<Bank[]> => {
    await delay(300);
    return [
      { id: 1, code: 'CBEBETAA', name: 'Commercial Bank of Ethiopia', swift: 'CBEBETAA', acc_no_length: 13 },
      { id: 2, code: 'AWINETAA', name: 'Awash Bank', swift: 'AWINETAA', acc_no_length: 13 },
      { id: 3, code: 'DASBETAA', name: 'Dashen Bank', swift: 'DASBETAA', acc_no_length: 13 },
      { id: 4, code: 'ABYSETAA', name: 'Abyssinia Bank', swift: 'ABYSETAA', acc_no_length: 13 },
      { id: 5, code: 'BUNIETAA', name: 'Bunna Bank', swift: 'BUNIETAA', acc_no_length: 13 },
      { id: 6, code: 'ZEMBETAA', name: 'Zemen Bank', swift: 'ZEMBETAA', acc_no_length: 12 },
      { id: 7, code: 'UBUGETAA', name: 'United Bank', swift: 'UBUGETAA', acc_no_length: 13 },
      { id: 8, code: 'NIBBETAA', name: 'Nib International Bank', swift: 'NIBBETAA', acc_no_length: 13 },
      { id: 9, code: 'COOPETAA', name: 'Cooperative Bank of Oromia', swift: 'COOPETAA', acc_no_length: 13 },
      { id: 10, code: 'BERHETAA', name: 'Berhan Bank', swift: 'BERHETAA', acc_no_length: 12 },
      { id: 11, code: 'ADISETAA', name: 'Addis International Bank', swift: 'ADISETAA', acc_no_length: 13 },
      { id: 12, code: 'ABIEETAA', name: 'Abay Bank', swift: 'ABIEETAA', acc_no_length: 13 },
      { id: 13, code: 'DEBUBETAA', name: 'Debub Global Bank', swift: 'DEBUBETAA', acc_no_length: 12 },
      { id: 14, code: 'ENATETAA', name: 'Enat Bank', swift: 'ENATETAA', acc_no_length: 13 },
      { id: 15, code: 'LIQUBETAA', name: 'Lion International Bank', swift: 'LIQUBETAA', acc_no_length: 13 },
      { id: 16, code: 'ORIRETAA', name: 'Oromia International Bank', swift: 'ORIRETAA', acc_no_length: 13 },
      { id: 17, code: 'SIQQETAA', name: 'Sinqe Bank', swift: 'SIQQETAA', acc_no_length: 13 },
      { id: 18, code: 'TSEBETAA', name: 'Tsedy Bank', swift: 'TSEBETAA', acc_no_length: 12 },
      { id: 19, code: 'ZEMZEM_BANK', name: 'Zemzem Bank', swift: 'ZEMZEM_BANK', acc_no_length: 13 },
      { id: 20, code: 'TELEBIRR', name: 'Telebirr', is_mobile_money: true },
      { id: 21, code: 'MPESA', name: 'M-PESA', is_mobile_money: true },
      { id: 22, code: 'AMOLE', name: 'Amole', is_mobile_money: true },
    ];
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  getExpenses: async (mahberId: string) => {
    await delay(400);
    const data = expenses.filter(e => e.mahber_id === mahberId);
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 }
    };
  },

  getPendingExpenses: async (mahberId: string) => {
    await delay(300);
    const data = expenses.filter(e => e.mahber_id === mahberId && e.status === 'Pending');
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 }
    };
  },

  approveExpense: async (mahberId: string, expenseId: string) => {
    await delay(800);
    const idx = expenses.findIndex(e => e.id === expenseId && e.mahber_id === mahberId);
    if (idx === -1) throw new Error('Expense not found');
    const updated = {
      ...expenses[idx],
      status: 'Paid' as const,
      approved_by: 'usr_1',
      approved_at: new Date().toISOString(),
      chapa_transfer_ref: `CHT_${Date.now()}`,
      chapa_transfer_status: 'success',
    } as Expense;
    expenses[idx] = updated;
    return updated;
  },

  rejectExpense: async (mahberId: string, expenseId: string, reason: string) => {
    await delay(500);
    const idx = expenses.findIndex(e => e.id === expenseId && e.mahber_id === mahberId);
    if (idx === -1) throw new Error('Expense not found');
    const updated = {
      ...expenses[idx],
      status: 'Rejected' as const,
      approved_by: 'usr_1',
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
    } as Expense;
    expenses[idx] = updated;
    return updated;
  },

  createExpense: async (mahberId: string, data: CreateExpenseDto) => {
    await delay(600);
    randomError(0.05);

    const creator = mockUsers[0];
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      mahber_id: mahberId,
      amount: data.amount,
      reason: data.reason,
      category: data.category,
      status: 'Pending',
      created_by: creator.id,
      recipient_name: data.recipient_name,
      recipient_account_type: data.recipient_account_type,
      recipient_account: data.recipient_account,
      recipient_bank_code: data.recipient_bank_code || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator,
    };

    expenses = [newExpense, ...expenses];

    const currentBalance = 4750;
    mockTransactions.unshift({
      id: `txn_exp_${Date.now()}`,
      mahber_id: mahberId,
      type: 'DEBIT' as const,
      amount: data.amount,
      balance_after: currentBalance - data.amount,
      description: `Expense: ${data.reason}`,
      created_at: new Date().toISOString(),
    });

    return newExpense;
  },

  // ── Payouts (Mock) ─────────────────────────────────────────────────────────
  getPayouts: async (mahberId: string) => {
    await delay(500);
    randomError(0.05);
    const data = mockPayouts.filter((p) => p.mahber_id === mahberId);
    return {
      data,
      meta: { total: data.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  getPayoutSummary: async (mahberId: string) => {
    await delay(400);
    const payouts = mockPayouts.filter((p) => p.mahber_id === mahberId);
    const totalAmount = payouts.reduce((s, p) => s + p.amount, 0);
    const categories: Record<string, { amount: number; count: number }> = {};
    for (const p of payouts) {
      if (!categories[p.category]) categories[p.category] = { amount: 0, count: 0 };
      categories[p.category].amount += p.amount;
      categories[p.category].count += 1;
    }
    return {
      total_amount: totalAmount,
      total_count: payouts.length,
      category_breakdown: Object.entries(categories).map(([cat, val]) => ({
        category: cat as PayoutCategory,
        amount: val.amount,
        count: val.count,
      })),
      recent: payouts.slice(0, 5),
    } satisfies PayoutSummary;
  },

  getPayout: async (mahberId: string, payoutId: string) => {
    await delay(300);
    const payout = mockPayouts.find((p) => p.id === payoutId && p.mahber_id === mahberId);
    if (!payout) throw new Error('Payout not found');
    return payout;
  },

  createPayout: async (mahberId: string, data: CreatePayoutDto) => {
    await delay(700);
    randomError(0.1);
    const member = mockUsers.find((u) => u.id === data.member_id);
    const newPayout: Payout = {
      id: `pout_${Date.now()}`,
      mahber_id: mahberId,
      member_id: data.member_id,
      amount: data.amount,
      category: data.category,
      reason: data.reason,
      status: 'PAID',
      approved_by: mockUsers[0].id,
      approved_by_admin: mockUsers[0].id,
      approved_by_treasurer: mockUsers[0].id,
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member,
    };
    mockPayouts.unshift(newPayout);
    return newPayout;
  },

  // ── Reports & Export (Mock) ─────────────────────────────────────────────────
  exportLedgerCsv: async (_mahberId: string, _params?: any) => {
    await delay(600);
    const header = 'Date,Transaction Type,Member ID,Amount,Running Balance,Description';
    const rows = [
      '2026-01-15,Contribution,usr_1,500.00,500.00,Monthly contribution',
      '2026-01-20,Contribution,usr_2,500.00,1000.00,Monthly contribution',
      '2026-01-25,Fine,usr_3,50.00,950.00,Missed attendance',
      '2026-02-01,Expense,usr_1,200.00,750.00,Event supplies',
      '2026-02-10,Equb_Payout,usr_2,4500.00,5250.00,Equb lottery payout',
    ];
    const csv = [header, ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  },

  exportFinancialReportPdf: async (_mahberId: string, _params?: any) => {
    await delay(800);
    const dummyPdf = new Uint8Array(100);
    return new Blob([dummyPdf], { type: 'application/pdf' });
  }
};
