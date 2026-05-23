import { apiClient } from '../client';
import { Payment, Transaction, InitiatePaymentDto, Fine, LotteryDraw, PaginatedResponse } from '@/lib/types';

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

  payRecurring: async (id: string): Promise<{ checkout_url: string; payment_id: string }> => {
    // Backend route: POST /mahbers/:id/pay
    const response = await apiClient.post<{ checkout_url: string; payment_id: string }>(
      `/mahbers/${id}/pay`
    );
    return response.data;
  },

  verifyPayment: async (tx_ref: string): Promise<Payment> => {
    // Backend route: GET /webhooks/chapa/verify/:tx_ref
    const response = await apiClient.get<Payment>(`/webhooks/chapa/verify/${tx_ref}`);
    return response.data;
  },
  
  getMahberPayments: async (mahberId: string): Promise<PaginatedResponse<Payment>> => {
    // Backend route: GET /mahbers/:id/payments
    const response = await apiClient.get<PaginatedResponse<Payment>>(`/mahbers/${mahberId}/payments`);
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

  executeLottery: async (mahberId: string, data?: { operationalCostRate?: number; fineThreshold?: number }): Promise<LotteryDraw> => {
    // Backend route: POST /mahbers/:id/lottery/execute
    const response = await apiClient.post<LotteryDraw>(`/mahbers/${mahberId}/lottery/execute`, data || {});
    return response.data;
  },

  // ── Audit ───────────────────────────────────────────────────────────────────
  getFinancialAudit: async (mahberId: string): Promise<any> => {
    // Backend route: GET /mahbers/:id/reports/audit
    const response = await apiClient.get<any>(`/mahbers/${mahberId}/reports/audit`);
    return response.data;
  }
};
