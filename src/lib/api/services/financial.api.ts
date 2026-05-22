import { apiClient } from '../client';
import { Payment, Transaction, InitiatePaymentDto, Fine, LotteryDraw, PaginatedResponse } from '@/lib/types';

export const financialApi = {
  // ── Payments ────────────────────────────────────────────────────────────────
  initiatePayment: async (data: InitiatePaymentDto): Promise<{ checkoutUrl: string; tx_ref: string }> => {
    // Backend route: POST /mahbers/:id/payments/initiate
    const { mahber_id, ...payload } = data;
    const response = await apiClient.post<{ checkoutUrl: string; tx_ref: string }>(
      `/mahbers/${mahber_id}/payments/initiate`, payload
    );
    return response.data;
  },

  verifyPayment: async (tx_ref: string): Promise<Payment> => {
    // NOTE: The backend does not expose a dedicated verify endpoint.
    // Payment verification happens via the Chapa webhook controller (POST /webhooks/chapa).
    // This method is kept for mock compatibility; during real integration, the frontend should
    // poll the payment status via GET /mahbers/:id/payments/:paymentId instead.
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
