import { AuditTrailEntry } from '@/lib/types';
import { mockUsers } from './users';

export const mockAuditTrail: AuditTrailEntry[] = [
  {
    id: 'aud_1',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'mahber',
    entity_id: 'mah_1',
    action: 'MAHBER_CREATED',
    new_value: { name: 'Addis Tech Equb' },
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_2',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'membership',
    entity_id: 'usr_2',
    action: 'MEMBER_ADDED',
    new_value: { added_member: 'usr_2' },
    created_at: new Date(Date.now() - 86400000 * 85).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_3',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'lottery',
    entity_id: 'lot_1',
    action: 'LOTTERY_DRAWN',
    new_value: { cycle: 1, winner: 'usr_1' },
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_4',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'fine',
    entity_id: 'fine_3',
    action: 'FINE_WAIVED',
    new_value: { fine_id: 'fine_3', reason: 'Forgiven by admin' },
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  }
];
