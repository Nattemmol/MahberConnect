import { apiClient } from "../client";

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type SuperAdminStats = {
  users: {
    total: number;
    active: number;
    suspended: number;
    super_admins: number;
  };
  mahbers: {
    total: number;
    active: number;
    suspended: number;
    breakdown: {
      MAHBER: number;
      EQUB: number;
      IDDIR: number;
    };
  };
  payments: {
    total: number;
    completed: number;
    failed: number;
    total_volume_etb: number;
  };
  system_health: Record<string, unknown>;
};

export type SuperAdminUserSummary = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  is_suspended: boolean;
  is_super_admin: boolean;
  created_at: string;
};

export type SuperAdminMahberSummary = {
  id: string;
  name: string;
  type: "MAHBER" | "EQUB" | "IDDIR";
  is_suspended: boolean;
  member_count: number;
  created_at: string;
};

export type SuperAdminPaymentSummary = {
  id: string;
  tx_ref: string;
  mahber_id: string;
  member_id: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
};

export type SuperAdminAuditLog = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string | null;
  actor?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  created_at: string;
};

export type SuperAdminMembership = {
  id: string;
  member_id: string;
  status: string;
  role: unknown;
  has_won_current_cycle?: boolean;
  mahber?: {
    id: string;
    name: string;
    type: "MAHBER" | "EQUB" | "IDDIR";
    is_suspended?: boolean;
  };
};

export type SuperAdminUserDetails = SuperAdminUserSummary & {
  bio?: string | null;
  memberships?: SuperAdminMembership[];
};

export type SuperAdminMahberDetails = {
  id: string;
  name: string;
  type: "MAHBER" | "EQUB" | "IDDIR";
  is_suspended: boolean;
  configuration: Record<string, unknown>;
  members: Array<{
    id: string;
    member_id: string;
    status: string;
    role: unknown;
    user?: {
      id: string;
      name: string;
      phone: string;
    };
  }>;
  recent_payments: SuperAdminPaymentSummary[];
};

export const superAdminApi = {
  getStats: async (): Promise<SuperAdminStats> => {
    const response = await apiClient.get<SuperAdminStats>("/super-admin/stats");
    return response.data;
  },

  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<SuperAdminUserSummary>> => {
    const response = await apiClient.get<PaginatedResponse<SuperAdminUserSummary>>(
      "/super-admin/users",
      { params },
    );
    return response.data;
  },

  getUserById: async (id: string): Promise<SuperAdminUserDetails> => {
    const response = await apiClient.get<SuperAdminUserDetails>(`/super-admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: string, is_suspended: boolean): Promise<SuperAdminUserSummary> => {
    const response = await apiClient.patch<SuperAdminUserSummary>(`/super-admin/users/${id}/status`, {
      is_suspended,
    });
    return response.data;
  },

  updateUserSuperAdmin: async (id: string, is_super_admin: boolean): Promise<SuperAdminUserSummary> => {
    const response = await apiClient.patch<SuperAdminUserSummary>(`/super-admin/users/${id}/super-admin`, {
      is_super_admin,
    });
    return response.data;
  },

  getMahbers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<SuperAdminMahberSummary>> => {
    const response = await apiClient.get<PaginatedResponse<SuperAdminMahberSummary>>(
      "/super-admin/mahbers",
      { params },
    );
    return response.data;
  },

  getMahberById: async (id: string): Promise<SuperAdminMahberDetails> => {
    const response = await apiClient.get<SuperAdminMahberDetails>(`/super-admin/mahbers/${id}`);
    return response.data;
  },

  updateMahberStatus: async (
    id: string,
    is_suspended: boolean,
  ): Promise<{ id: string; name: string; is_suspended: boolean }> => {
    const response = await apiClient.patch<{ id: string; name: string; is_suspended: boolean }>(
      `/super-admin/mahbers/${id}/status`,
      { is_suspended },
    );
    return response.data;
  },

  getPayments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<SuperAdminPaymentSummary>> => {
    const response = await apiClient.get<PaginatedResponse<SuperAdminPaymentSummary>>(
      "/super-admin/payments",
      { params },
    );
    return response.data;
  },

  getAuditLogs: async (params: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SuperAdminAuditLog>> => {
    const response = await apiClient.get<PaginatedResponse<SuperAdminAuditLog>>(
      "/super-admin/audit-logs",
      { params },
    );
    return response.data;
  },
};
