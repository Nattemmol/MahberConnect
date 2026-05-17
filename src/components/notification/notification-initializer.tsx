'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { notificationService } from '@/lib/api/service-factory';

/**
 * Automatically registers the device for push notifications
 * shortly after the user logs in or the dashboard is loaded.
 */
export function NotificationInitializer() {
  const { user } = useAuthStore();
  const registeredRef = useRef(false);

  useEffect(() => {
    // Only register if user is logged in and we haven't already registered in this session
    if (user && !registeredRef.current) {
      const timer = setTimeout(async () => {
        try {
          // In a real app, this is where you'd get the FCM token
          // For now we use the requested placeholder
          await notificationService.registerDevice({
            token: "fcm-token-abc123",
            platform: "web",
            userId: user.id
          });
          
          registeredRef.current = true;
          console.log('Device auto-registered for notifications successfully.');
        } catch (error) {
          console.error('Failed to auto-register device for notifications:', error);
        }
      }, 3000); // Wait 3 seconds to ensure everything else is loaded

      return () => clearTimeout(timer);
    }
  }, [user]);

  return null;
}
