import { apiClient } from '../client';

export interface RegisterDeviceDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
  userId: string;
}

export interface UnregisterDeviceDto {
  token: string;
  userId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'event' | 'membership_reinstated';
  is_read: boolean;
  created_at: string;
  link?: string;
}

export const notificationApi = {
  registerDevice: async (data: RegisterDeviceDto): Promise<void> => {
    await apiClient.post('/notifications/register-device', data);
  },

  unregisterDevice: async (data: UnregisterDeviceDto): Promise<void> => {
    await apiClient.delete('/notifications/unregister-device', { data });
  },

  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all');
  }
};
