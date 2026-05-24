import { AuditTrailEntry } from '@/lib/types';
import { mockUsers } from './users';

const now = Date.now();
const day = 86400000;

export const mockAuditTrail: AuditTrailEntry[] = [
  {
    id: 'aud_1',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'mahber',
    entity_id: 'mah_1',
    action: 'MAHBER_CREATED',
    new_value: { name: 'Addis Tech Equb' },
    created_at: new Date(now - day * 180).toISOString(),
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
    created_at: new Date(now - day * 170).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_3',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'membership',
    entity_id: 'usr_3',
    action: 'MEMBER_ADDED',
    new_value: { added_member: 'usr_3' },
    created_at: new Date(now - day * 160).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_4',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_1',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_001' },
    created_at: new Date(now - day * 150).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_5',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_3',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_003' },
    created_at: new Date(now - day * 140).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_6',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'fine',
    entity_id: 'fine_1',
    action: 'FINE_APPLIED',
    new_value: { amount: 350, reason: 'Missed meeting' },
    created_at: new Date(now - day * 135).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_7',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_4',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 350, payment_type: 'Fine', tx_ref: 'tx_mock_004' },
    created_at: new Date(now - day * 130).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_8',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_5',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_005' },
    created_at: new Date(now - day * 120).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_9',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'lottery',
    entity_id: 'lot_1',
    action: 'LOTTERY_DRAWN',
    new_value: { cycle: 1, winner: 'usr_1', payout: 50000 },
    created_at: new Date(now - day * 110).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_10',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_7',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_007' },
    created_at: new Date(now - day * 100).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_11',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'fine',
    entity_id: 'fine_2',
    action: 'FINE_APPLIED',
    new_value: { amount: 200, reason: 'Late payment' },
    created_at: new Date(now - day * 90).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_12',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_8',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_008' },
    created_at: new Date(now - day * 80).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_13',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'membership',
    entity_id: 'usr_4',
    action: 'MEMBER_REMOVED',
    new_value: { removed_member: 'usr_4', reason: 'Left voluntarily' },
    created_at: new Date(now - day * 70).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_14',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_11',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_011' },
    created_at: new Date(now - day * 60).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_15',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'fine',
    entity_id: 'fine_4',
    action: 'FINE_WAIVED',
    new_value: { fine_id: 'fine_4', reason: 'Forgiven by admin' },
    created_at: new Date(now - day * 50).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_16',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_13',
    action: 'PAYMENT_COMPLETED',
    new_value: { status: 'Completed', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_013' },
    created_at: new Date(now - day * 40).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_17',
    mahber_id: 'mah_1',
    actor_id: null,
    entity_type: 'system',
    entity_id: 'sys_config',
    action: 'CONFIG_UPDATED',
    new_value: { contribution_amount: 5000, cycle: 'Monthly' },
    created_at: new Date(now - day * 30).toISOString(),
    actor: null as any
  },
  {
    id: 'aud_18',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_2',
    action: 'PAYMENT_FAILED',
    old_value: { status: 'Pending' },
    new_value: { status: 'Failed', amount: 500, payment_type: 'Fine' },
    created_at: new Date(now - day * 20).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_19',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'payment',
    entity_id: 'pay_14',
    action: 'PAYMENT_INITIATED',
    new_value: { status: 'Pending', amount: 5000, payment_type: 'Contribution', tx_ref: 'tx_mock_014' },
    created_at: new Date(now - day * 10).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  },
  {
    id: 'aud_20',
    mahber_id: 'mah_1',
    actor_id: 'usr_1',
    entity_type: 'membership',
    entity_id: 'usr_5',
    action: 'MEMBER_APPROVED',
    new_value: { approved_member: 'usr_5' },
    created_at: new Date(now - day * 5).toISOString(),
    actor: { id: 'usr_1', name: mockUsers[0].name }
  }
];
