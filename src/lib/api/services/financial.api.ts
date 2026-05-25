import { apiClient } from '../client';
import { Payment, Transaction, InitiatePaymentDto, Fine, LotteryDraw, PaginatedResponse, OutstandingObligations, PaymentQueryParams, Expense, CreateExpenseDto, Payout, CreatePayoutDto, PayoutSummary, Bank } from '@/lib/types';
import { auditApi } from './audit.api';

export const financialApi = {
  // ── Payments ────────────────────────────────────────────────────────────────
  initiatePayment: async (data: InitiatePaymentDto): Promise<{ checkoutUrl: string; tx_ref: string }> => {
    // Backend route: POST /mahbers/:id/payments/initiate
    const { mahber_id, ...payload } = data;
    const response = await apiClient.post(`/mahbers/${mahber_id}/payments/initiate`, payload);
    const raw = response.data as any;
    return {
      checkoutUrl: raw.checkoutUrl ?? raw.checkout_url ?? raw.checkout_url ?? '',
      tx_ref: raw.tx_ref ?? raw.payment_id ?? raw.paymentId ?? ''
    };
  },

  getOutstanding: async (mahberId: string): Promise<OutstandingObligations> => {
    const response = await apiClient.get<OutstandingObligations>(`/mahbers/${mahberId}/payments/outstanding`);
    return response.data;
  },

  payRecurring: async (id: string): Promise<{ checkout_url: string; payment_id: string }> => {
    // Backend route: POST /mahbers/:id/pay
    const response = await apiClient.post<{ checkout_url: string; tx_ref: string }>(
      `/mahbers/${id}/payments/initiate`,
      {}
    );
    return {
      checkout_url: response.data.checkout_url,
      payment_id: response.data.tx_ref,
    };
  },

  verifyPayment: async (tx_ref: string): Promise<Payment> => {
    // Backend route: GET /webhooks/chapa/verify/:tx_ref
    const response = await apiClient.get<Payment>(`/webhooks/chapa/verify/${tx_ref}`);
    return response.data;
  },
  
  getMahberPayments: async (mahberId: string, params?: PaymentQueryParams): Promise<PaginatedResponse<Payment>> => {
    // Backend route: GET /mahbers/:id/payments
    const response = await apiClient.get<PaginatedResponse<Payment>>(`/mahbers/${mahberId}/payments`, { params });
    return response.data;
  },

  // ── Ledger ──────────────────────────────────────────────────────────────────
  getMahberLedger: async (mahberId: string): Promise<PaginatedResponse<Transaction>> => {
    // Backend route: GET /mahbers/:id/ledger
    const response = await apiClient.get<PaginatedResponse<Transaction>>(`/mahbers/${mahberId}/ledger`);
    return response.data;
  },

  getWallet: async (
    id: string,
    params?: { memberId?: string; page?: number; limit?: number }
  ): Promise<{
    entries: Array<{
      id: string;
      mahber_id: string;
      member_id: string;
      transaction_type: string;
      amount: string;
      running_balance: string;
      payment_id: string | null;
      fine_id: string | null;
      lottery_id: string | null;
      description: string;
      created_at: string;
    }>;
    balance: string;
  }> => {
    // Backend route: GET /mahbers/:id/wallet
    const response = await apiClient.get<{
      entries: Array<{
        id: string;
        mahber_id: string;
        member_id: string;
        transaction_type: string;
        amount: string;
        running_balance: string;
        payment_id: string | null;
        fine_id: string | null;
        lottery_id: string | null;
        description: string;
        created_at: string;
      }>;
      balance: string;
    }>(`/mahbers/${id}/wallet`, { params });
    return response.data;
  },

  // ── Fines ───────────────────────────────────────────────────────────────────
  getFines: async (mahberId: string): Promise<PaginatedResponse<Fine>> => {
    // Backend route: GET /mahbers/:id/fines
    const response = await apiClient.get<PaginatedResponse<Fine>>(`/mahbers/${mahberId}/fines`);
    return response.data;
  },
  
  waiveFine: async (mahberId: string, fineId: string, reason = 'Waived by admin'): Promise<Fine> => {
    // Backend route: POST /mahbers/:id/fines/:fineId/waive  (expects { reason } body)
    const response = await apiClient.post<Fine>(`/mahbers/${mahberId}/fines/${fineId}/waive`, { reason });
    return response.data;
  },

  // ── Lottery ─────────────────────────────────────────────────────────────────
  getLotteryHistory: async (mahberId: string): Promise<LotteryDraw[]> => {
    // Backend route: GET /mahbers/:id/lottery/history
    const response = await apiClient.get<LotteryDraw[]>(`/mahbers/${mahberId}/lottery/history`);
    return response.data;
  },

  executeLottery: async (mahberId: string): Promise<LotteryDraw> => {
    // Backend route: POST /mahbers/:id/lottery/execute
    const response = await apiClient.post<LotteryDraw>(`/mahbers/${mahberId}/lottery/execute`, {});
    return response.data;
  },

  // ── Expenses ────────────────────────────────────────────────────────────────
  createExpense: async (mahberId: string, data: CreateExpenseDto): Promise<Expense> => {
    const response = await apiClient.post<Expense>(`/mahbers/${mahberId}/expenses`, data);
    return response.data;
  },

  getExpenses: async (mahberId: string): Promise<PaginatedResponse<Expense>> => {
    const response = await apiClient.get<PaginatedResponse<Expense>>(`/mahbers/${mahberId}/expenses`);
    return response.data;
  },

  getPendingExpenses: async (mahberId: string): Promise<PaginatedResponse<Expense>> => {
    const response = await apiClient.get<PaginatedResponse<Expense>>(`/mahbers/${mahberId}/expenses/pending`);
    return response.data;
  },

  approveExpense: async (mahberId: string, expenseId: string): Promise<Expense> => {
    const response = await apiClient.post<Expense>(`/mahbers/${mahberId}/expenses/${expenseId}/approve`);
    return response.data;
  },

  rejectExpense: async (mahberId: string, expenseId: string, reason: string): Promise<Expense> => {
    const response = await apiClient.post<Expense>(`/mahbers/${mahberId}/expenses/${expenseId}/reject`, { reason });
    return response.data;
  },

  // ── Payouts ─────────────────────────────────────────────────────────────────
  getPayouts: async (mahberId: string): Promise<PaginatedResponse<Payout>> => {
    const response = await apiClient.get<PaginatedResponse<Payout>>(`/mahbers/${mahberId}/payouts`);
    return response.data;
  },

  getPayoutSummary: async (mahberId: string): Promise<PayoutSummary> => {
    const response = await apiClient.get<PayoutSummary>(`/mahbers/${mahberId}/payouts/summary`);
    return response.data;
  },

  getPayout: async (mahberId: string, payoutId: string): Promise<Payout> => {
    const response = await apiClient.get<Payout>(`/mahbers/${mahberId}/payouts/${payoutId}`);
    return response.data;
  },

  createPayout: async (mahberId: string, data: CreatePayoutDto): Promise<Payout> => {
    const response = await apiClient.post<Payout>(`/mahbers/${mahberId}/payouts`, data);
    return response.data;
  },

  // ── Receipt ─────────────────────────────────────────────────────────────────
  downloadReceipt: async (mahberId: string, paymentId: string): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/payments/${paymentId}/receipt`,
      { responseType: 'blob' },
    );
    return response.data as Blob;
  },

  // ── Reports & Export ────────────────────────────────────────────────────────
  exportLedgerCsv: async (
    mahberId: string,
    params?: { startDate?: string; endDate?: string; type?: string },
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/reports/export`,
      {
        params: { ...params, format: 'csv' },
        responseType: 'blob',
      },
    );
    return response.data as Blob;
  },

  exportFinancialReportPdf: async (
    mahberId: string,
    params?: { startDate?: string; endDate?: string },
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/mahbers/${mahberId}/reports/export`,
      {
        params: { ...params, format: 'pdf' },
        responseType: 'blob',
      },
    );
    return response.data as Blob;
  },

  // ── Chapa Banks ──────────────────────────────────────────────────────────────
  getBanks: async (): Promise<Bank[]> => {
    const response = await apiClient.get<Bank[]>('/chapa/banks');
    return response.data;
  },

  // ── Audit ───────────────────────────────────────────────────────────────────
  getFinancialAudit: async (mahberId: string): Promise<any> => {
    return auditApi.getAuditTrail(mahberId, { limit: 100 });
  }
};
