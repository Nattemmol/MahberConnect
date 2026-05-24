import { delay, paginate } from '../utils';
import { mockAuditTrail } from '../data/audit-trail';

let auditTrail = [...mockAuditTrail];

export const auditMock = {
  getAuditTrail: async (mahberId: string, params: any = {}) => {
    await delay(400);

    const { page = 1, limit = 10, entity_type, search, sort = 'date', order = 'desc' } = params || {};

    let filtered = auditTrail.filter(a => a.mahber_id === mahberId);

    if (entity_type) {
      filtered = filtered.filter(a => a.entity_type === entity_type);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.entity_type.toLowerCase().includes(q) ||
          a.action.toLowerCase().includes(q) ||
          a.entity_id.toLowerCase().includes(q) ||
          (a.actor?.name?.toLowerCase().includes(q) ?? false)
      );
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sort === 'date') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sort === 'entity_type') {
        cmp = a.entity_type.localeCompare(b.entity_type);
      } else if (sort === 'action') {
        cmp = a.action.localeCompare(b.action);
      }
      return order === 'desc' ? -cmp : cmp;
    });

    return paginate(filtered, page, limit);
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
