import { apiClient } from '../client';
import { User } from '@/lib/types';

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { phone, password });
    return response.data;
  },
  
  register: async (phone: string, password: string, name: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', { phone, password, name });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; email?: string | null; bio?: string | null; notification_prefs?: Record<string, boolean> }): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
  },
};
