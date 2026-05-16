import { apiClient } from '../client';
import { PaginatedResponse, AuditTrailEntry } from '@/lib/types';

export const auditApi = {
  getAuditTrail: async (
    mahberId: string,
    params: {
      page?: number;
      limit?: number;
      entity_type?: string;
      actor_id?: string;
      start_date?: string;
      end_date?: string;
    } = {}
  ): Promise<PaginatedResponse<AuditTrailEntry>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());
    if (params.entity_type) query.append("entity_type", params.entity_type);
    if (params.actor_id) query.append("actor_id", params.actor_id);
    if (params.start_date) query.append("start_date", params.start_date);
    if (params.end_date) query.append("end_date", params.end_date);

    const response = await apiClient.get<PaginatedResponse<AuditTrailEntry>>(
      `/mahbers/${mahberId}/audit-trail?${query.toString()}`
    );
    return response.data;
  }
};
