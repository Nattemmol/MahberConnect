import { delay } from '../utils';
import { mockAuditTrail } from '../data/audit-trail';

let auditTrail = [...mockAuditTrail];

export const auditMock = {
  getAuditTrail: async (mahberId: string, params: any = {}) => {
    await delay(600);
    const data = auditTrail
      .filter(a => a.mahber_id === mahberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
    return {
      data,
      meta: { total: data.length, page: params.page || 1, limit: params.limit || 50, totalPages: 1 },
    };
  },
  
  // Internal mock helper to allow other mock services to log actions
  _logAction: (mahberId: string, actorId: string, action: string, details: any, actor: any) => {
    auditTrail = [
      {
        id: `aud_${Date.now()}`,
        mahber_id: mahberId,
        actor_id: actorId,
        entity_type: 'other',
        entity_id: 'none',
        action,
        new_value: details,
        created_at: new Date().toISOString(),
        actor
      },
      ...auditTrail
    ];
  }
};
