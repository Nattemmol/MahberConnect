import { Notification, RegisterDeviceDto, UnregisterDeviceDto } from '../../api/services/notification.api';

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Contribution Request',
    message: 'A new contribution of 500 ETB is requested for Addis Tech Equb.',
    type: 'payment',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    link: '/mahbers/1/payments'
  },
  {
    id: '2',
    title: 'Meeting Reminder',
    message: 'Monthly meeting for Global Diaspora Mahber starts in 2 hours.',
    type: 'event',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    link: '/mahbers/2/events'
  },
  {
    id: '3',
    title: 'Security Alert',
    message: 'Your password was successfully changed.',
    type: 'info',
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const notificationMock = {
  registerDevice: async (data: RegisterDeviceDto): Promise<void> => {
    console.log('Mock: Registered device', data);
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  unregisterDevice: async (data: UnregisterDeviceDto): Promise<void> => {
    console.log('Mock: Unregistered device', data);
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  getNotifications: async (): Promise<Notification[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockNotifications), 800));
  },

  markAsRead: async (id: string): Promise<void> => {
    console.log('Mock: Mark as read', id);
    return new Promise(resolve => setTimeout(resolve, 300));
  },

  markAllAsRead: async (): Promise<void> => {
    console.log('Mock: Mark all as read');
    return new Promise(resolve => setTimeout(resolve, 300));
  }
};
