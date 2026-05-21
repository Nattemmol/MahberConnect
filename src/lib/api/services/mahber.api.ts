import { apiClient } from "../client";
import { Mahber, CreateMahberDto, UpdateMahberDto, JoinRequest } from "@/lib/types";

export const mahberApi = {
  getMahbers: async (): Promise<Mahber[]> => {
    const response = await apiClient.get<Mahber[]>("/mahbers");
    return response.data;
  },

  getPublicMahbers: async (): Promise<Mahber[]> => {
    const response = await apiClient.get<Mahber[]>("/mahbers/public");
    return response.data;
  },

  createMahber: async (data: CreateMahberDto): Promise<Mahber> => {
    const response = await apiClient.post<Mahber>("/mahbers", data);
    return response.data;
  },

  getMahberById: async (id: string): Promise<Mahber> => {
    const response = await apiClient.get<Mahber>(`/mahbers/${id}`);
    return response.data;
  },

  joinMahber: async (
    id: string,
    data?: { invitation_code?: string },
  ): Promise<JoinRequest> => {
    const response = await apiClient.post<JoinRequest>(
      `/mahbers/${id}/join-requests`,
      data ?? {},
    );
    return response.data;
  },

  joinMahberSubsystem: async (
    id: string
  ): Promise<{
    paymentRequired: boolean;
    amount?: number;
    currency?: string;
    paymentUrl?: string;
    token?: string;
    message?: string;
    active?: boolean;
  }> => {
    const response = await apiClient.post<{
      paymentRequired: boolean;
      amount?: number;
      currency?: string;
      paymentUrl?: string;
      token?: string;
      message?: string;
      active?: boolean;
    }>(`/mahbers/${id}/join`);
    return response.data;
  },

  updateMahber: async (id: string, data: UpdateMahberDto): Promise<Mahber> => {
    const response = await apiClient.put<Mahber>(`/mahbers/${id}`, data);
    return response.data;
  },

  deleteMahber: async (id: string): Promise<void> => {
    await apiClient.delete(`/mahbers/${id}`);
  },
};
