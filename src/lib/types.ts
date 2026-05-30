export type User = {
  id: string;
  phone: string;
  name: string;
  email?: string;
  bio?: string;
  is_super_admin?: boolean;
  is_suspended?: boolean;
  notification_prefs?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
};

export type MahberType = "MAHBER" | "EQUB" | "IDDIR";
export type MemberRole = "ADMIN" | "MEMBER";
export type JoinRequestStatus = "Pending" | "Approved" | "Rejected";
export type PaymentFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly";
export type PenaltyMode = "percentage" | "fixed";

export type MahberConfiguration = {
  cycle: string;
  contribution_amount: number;
  payment_frequency?: PaymentFrequency;
  payment_day?: number;
  join_fee_required?: boolean;
  join_fee_amount?: number;
  penalty_rate?: number;
  penalty_mode?: PenaltyMode;
  penalty_interval?: string;
  max_fine_total?: number;
  operation_cost_rate?: number;
  fine_threshold?: number;
  role_limits?: Record<string, number>;
};

export type Mahber = {
  id: string;
  name: string;
  type: MahberType;
  configuration: MahberConfiguration;
  is_public: boolean;
  invitation_code: string | null;
  created_at: string;
  updated_at: string;
  _count?: {
    members: number;
  };
};

export type Membership = {
  id: string;
  user_id: string;
  mahber_id: string;
  role: MemberRole;
  joined_at: string;
  mahber?: Mahber;
  user?: User;
};

export type CreateMahberDto = {
  name: string;
  type: MahberType;
  is_public: boolean;
  configuration: MahberConfiguration;
  invitation_code?: string | null;
};

export type UpdateMahberDto = Partial<CreateMahberDto>;

export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Expired";
export type PaymentType = "Contribution" | "JoinFee" | "Fine";

export type Payment = {
  id: string;
  member_id: string;
  mahber_id: string;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatus;
  tx_ref: string;
  checkout_url?: string | null;
  fine_ids?: string[] | null;
  period_start?: string | null;
  period_end?: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
};

export type Transaction = {
  id: string;
  mahber_id: string;
  payment_id?: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  payment?: Payment;
};

export type OutstandingFine = {
  id: string;
  amount: number;
  reason: string;
  issued_at: string;
};

export type OutstandingObligations = {
  contribution_due: number | null;
  contribution_due_date: string | null;
  pending_fines: OutstandingFine[];
  total_outstanding: number;
  has_pending_payment: boolean;
  pending_payment_id?: string;
  pending_payment_amount?: number;
  pending_payment_type?: PaymentType;
};

export type InitiatePaymentDto = {
  mahber_id: string;
  fine_ids?: string[];
};

export type PaymentQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: PaymentType | "All";
  sort?: "date" | "amount" | "status";
  order?: "asc" | "desc";
};

// ── RBAC ──────────────────────────────────────────────────────────────────────
export type Permission =
  | "manage_members"
  | "manage_finances"
  | "create_events"
  | "send_announcements"
  | "view_reports"
  | "manage_roles";

export type RoleName =
  | "Admin"
  | "Treasurer"
  | "Secretary"
  | "Advisor"
  | "Member"
  | "custom";

export type MahberRoleDefinition = {
  name: RoleName;
  permissions: Permission[];
  description?: string;
};

export type FinancialReportSummary = {
  totalContributions: number;
  totalFines: number;
  totalExpenses: number;
  totalPayouts: number;
  netBalance: number;
  startDate?: string;
  endDate?: string;
};

export type MembershipStatus =
  | "Pending"
  | "Approved"
  | "Payment_Required"
  | "Active"
  | "Suspended"
  | "Rejected"
  | "Invalidated"
  | "Banned";

export type MemberDetail = {
  id: string;
  mahber_id: string;
  member_id: string;
  status: MembershipStatus;
  role: MemberRole;
  role_name?: RoleName;
  permissions?: Permission[];
  balance: string;
  has_won_current_cycle: boolean;
  next_payment_due?: string | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  approval_date?: string;
  activation_date?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  mahber?: Mahber;
};

export type JoinRequest = {
  id: string;
  mahber_id: string;
  user_id: string;
  status: JoinRequestStatus;
  invitation_code?: string | null;
  rejection_reason?: string;
  is_invitation?: boolean;
  approval_date?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  mahber?: Mahber;
};

export type UpdateRoleDto = {
  role_name: RoleName;
  custom_permissions?: Permission[];
};

export type SuspendMemberParams = {
  duration_days?: number;
  reason?: string;
};

export type JoinRequestActionDto = {
  action: "approve" | "reject";
  rejection_reason?: string;
};

export type BatchProcessItem = {
  requestId: string;
  action: "approve" | "reject";
  rejection_reason?: string;
};

export type BatchProcessResult = {
  approved: number;
  rejected: number;
  failed: Array<{ requestId: string; reason: string }>;
};

// ── Generic Wrappers ──────────────────────────────────────────────────────────
export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type UploadResponse<T> = {
  data: T[];
  meta: {
    uploaded: number;
  };
};

// ── Event Invitations ──────────────────────────────────────────────────────────
export type EventInvitationStatus = "Pending" | "Accepted" | "Declined";

export type EventInvitation = {
  id: string;
  event_id: string;
  mahber_id: string;
  member_id: string;
  status: EventInvitationStatus;
  source?: "admin_invite" | "self_register";
  sent_at: string;
  responded_at?: string;
  channels_used?: string[];
  member?: User;
  event?: Event;
};

export type SendInvitationsResponse = {
  invited: number;
  already_invited: number;
  invalid_members: number;
  invitations: EventInvitation[];
};

// ── Events & Attendance ───────────────────────────────────────────────────────
export type EventType =
  | "Meeting"
  | "Ceremony"
  | "Fundraiser"
  | "Social_Gathering";

export type Event = {
  id: string;
  mahber_id: string;
  title: string;
  description: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location: string;
  is_mandatory: boolean;
  is_cancelled: boolean;
  recurrence_pattern?: "None" | "Weekly" | "Monthly";
  recurrence_end_date?: string;
  series_id?: string;
  created_by?: string;
  host_id?: string | null;
  host_user?: User;
  created_at: string;
};

export type Attendance = {
  id: string;
  event_id: string;
  member_id: string;
  mahber_id: string;
  checked_in_at: string;
  user?: User;
};

export type AttendanceAnalytics = {
  event_id: string;
  total_members: number;
  attended: number;
  absent: number;
  attendance_percentage: number;
  is_mandatory: boolean;
  is_cancelled: boolean;
};

export type AttendanceTrends = {
  trends: Array<{
    month: string;
    event_count: number;
    total_members: number;
    total_attended: number;
    average_attendance_rate: number;
  }>;
  total_active_members: number;
};

export type EventPhoto = {
  id: string;
  event_id: string;
  mahber_id: string;
  uploader_id: string;
  file_path: string;
  thumbnail_path?: string;
  cloudinary_public_id?: string;
  caption?: string;
  created_at: string;
  user?: User;
};

export type QRCodeResponse = {
  qr_code: string;
};

export type CreateEventDto = {
  title: string;
  description: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location: string;
  is_mandatory?: boolean;
  host_id?: string;
  recurrence_pattern?: "None" | "Weekly" | "Monthly";
  recurrence_end_date?: string;
};

// ── Communication & Engagement ────────────────────────────────────────────────
export type ChatMessage = {
  id: string;
  mahber_id: string;
  sender_id: string;
  content: string;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
  sender?: User;
  read_by_count: number;
  is_read_by_me: boolean;
};

export type ReadReceipt = {
  member_id: string;
  member_name: string;
  read_at: string;
};

export type AnnouncementPriority = "Normal" | "Important" | "Urgent";

export type AnnouncementRead = {
  id: string;
  announcement_id: string;
  member_id: string;
  read_at: string;
};

export type Announcement = {
  id: string;
  mahber_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_audience?: string;
  scheduled_at?: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
  reads?: AnnouncementRead[];
  creator?: User;
};

export type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "RANKED_CHOICE";

export type PollOption = {
  id: string;
  text: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  member_id: string;
  choices: string[];
  created_at: string;
};

export type Poll = {
  id: string;
  mahber_id: string;
  question: string;
  options: PollOption[];
  poll_type: PollType;
  voting_deadline: string;
  eligibility_criteria?: string;
  is_closed: boolean;
  created_by: string;
  created_at: string;
  votes?: Vote[];
  creator?: User;
};

export type PollResults = {
  poll_id: string;
  poll_type: PollType;
  total_votes: number;
  results: {
    option_id: string;
    option_text: string;
    vote_count: number;
  }[];
  irv_rounds?: {
    round: number;
    counts: Record<string, number>;
    eliminated: string[];
    winner?: string;
  }[];
};

export type CreateAnnouncementDto = {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  target_audience?: string;
  scheduled_at?: string;
};

export type CreatePollDto = {
  question: string;
  options: string[];
  poll_type: PollType;
  voting_deadline: string;
  eligibility_criteria?: string;
};

// ── Expenses ────────────────────────────────────────────────────────────────
export type ExpenseCategory = "Operational" | "Maintenance" | "Event" | "Other";
export type ExpenseStatus = "Pending" | "Rejected" | "Paid" | "Failed";

export type Expense = {
  id: string;
  mahber_id: string;
  amount: number;
  reason: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  recipient_name: string;
  recipient_account_type: string;
  recipient_account: string;
  recipient_bank_code?: string;
  chapa_transfer_ref?: string;
  chapa_transfer_status?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  approver?: User;
};

export type CreateExpenseDto = {
  amount: number;
  reason: string;
  category: ExpenseCategory;
  recipient_name: string;
  recipient_account_type: "bank" | "telebirr";
  recipient_account: string;
  recipient_bank_code?: string;
};

// ── Payouts ─────────────────────────────────────────────────────────────────
export type PayoutCategory = "Iddir_Benefit" | "Event_Reimbursement" | "Recurring" | "General" | "Equb_Payout";

export type PayoutStatus = "PENDING_APPROVAL" | "APPROVED" | "PAID" | "REJECTED";

export type Payout = {
  id: string;
  mahber_id: string;
  member_id: string;
  amount: number;
  category: PayoutCategory;
  reason: string;
  status: PayoutStatus;
  approved_by: string | null;
  approved_by_admin: string | null;
  approved_by_treasurer: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  member?: User;
};

export type ApprovePayoutResponse = {
  id: string;
  status: PayoutStatus;
  approved_by_admin: string | null;
  approved_by_treasurer: string | null;
  paid_at: string | null;
};

export type CreatePayoutDto = {
  member_id: string;
  amount: number;
  category: PayoutCategory;
  reason: string;
};

export type PayoutSummary = {
  total_amount: number;
  total_count: number;
  category_breakdown: { category: PayoutCategory; amount: number; count: number }[];
  recent: Payout[];
};

// ── Chapa Banks ──────────────────────────────────────────────────────────────
export type Bank = {
  id: number;
  code: string | number;
  name: string;
  swift?: string;
  acc_no_length?: number;
  is_mobile_money?: boolean;
};

// ── Fines & Lottery ──────────────────────────────────────────────────────────
export type FineStatus = "pending" | "paid" | "waived";

export type Fine = {
  id: string;
  mahber_id: string;
  member_id: string;
  amount: number;
  reason: string;
  status: FineStatus;
  issued_at: string;
  resolved_at?: string;
  member?: User; // Joined via membership for display
};

export type LotteryExecuteParams = {
  operationalCostRate?: number;
  fineThreshold?: number;
};

export type LotteryDraw = {
  id: string;
  mahber_id: string;
  cycle_number?: number;
  winner_id: string;
  eligible_members: string[];
  random_seed: string;
  payout_amount: number;
  payout_id?: string;
  created_at: string;
  winner?: User;
};

// ── Audit Trail ──────────────────────────────────────────────────────────────
export type AuditTrailEntry = {
  id: string;
  mahber_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  created_at: string;
  actor?: { id: string; name: string };
};
