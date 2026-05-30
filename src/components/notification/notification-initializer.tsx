'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { notificationService } from '@/lib/api/service-factory';
import { socketService } from '@/lib/socket';
import { useNotificationStore } from '@/lib/stores/notification-store';
import toast from 'react-hot-toast';

export function NotificationInitializer() {
  const { user } = useAuthStore();
  const registeredRef = useRef(false);
  const router = useRouter();
  const incrementUnread = useNotificationStore((s) => s.incrementUnreadCount);

  useEffect(() => {
    if (user && !registeredRef.current) {
      const timer = setTimeout(async () => {
        try {
          await notificationService.registerDevice({
            token: "fcm-token-abc123",
            platform: "web",
            userId: user.id
          });

          registeredRef.current = true;
        } catch (error) {
          console.error('Failed to auto-register device for notifications:', error);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const socket = socketService.connect();
    socketService.joinUserRoom(user.id);

    const handleReinstated = (data: { mahberId: string; mahberName: string }) => {
      incrementUnread();
      toast(
        (t) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              router.push(`/mahbers/${data.mahberId}`);
              toast.dismiss(t.id);
            }}
          >
            <p className="font-semibold">Membership Reinstated</p>
            <p className="text-sm text-text-secondary">
              Your temporary suspension has expired and your membership in &quot;{data.mahberName}&quot; has been reinstated.
            </p>
          </div>
        ),
        { duration: 6000 },
      );
    };

    socket.on('membership_reinstated', handleReinstated);

    return () => {
      socket.off('membership_reinstated', handleReinstated);
    };
  }, [user, router, incrementUnread]);

  return null;
}
