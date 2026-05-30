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

    const handleLotteryResult = (data: { mahberId: string; winnerName: string; amount: number }) => {
      incrementUnread();
      toast(
        (t) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              router.push(`/mahbers/${data.mahberId}/lottery`);
              toast.dismiss(t.id);
            }}
          >
            <p className="font-semibold">Lottery Draw Completed</p>
            <p className="text-sm text-text-secondary">
              {data.winnerName} won ETB {data.amount.toLocaleString()}! Payout pending approval.
            </p>
          </div>
        ),
        { duration: 8000 },
      );
    };

    const handlePayoutApprovalNeeded = (data: { mahberId: string; payoutId: string; amount: number }) => {
      incrementUnread();
      toast(
        (t) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              router.push(`/mahbers/${data.mahberId}/payouts`);
              toast.dismiss(t.id);
            }}
          >
            <p className="font-semibold">Payout Approval Needed</p>
            <p className="text-sm text-text-secondary">
              An Equb payout of ETB {data.amount.toLocaleString()} needs your approval.
            </p>
          </div>
        ),
        { duration: 8000 },
      );
    };

    const handlePayoutReleased = (data: { mahberId: string; amount: number }) => {
      incrementUnread();
      toast(
        (t) => (
          <div
            className="cursor-pointer"
            onClick={() => {
              router.push(`/mahbers/${data.mahberId}/payouts`);
              toast.dismiss(t.id);
            }}
          >
            <p className="font-semibold">Payout Released</p>
            <p className="text-sm text-text-secondary">
              Your Equb payout of ETB {data.amount.toLocaleString()} has been approved and released!
            </p>
          </div>
        ),
        { duration: 8000 },
      );
    };

    socket.on('membership_reinstated', handleReinstated);
    socket.on('lottery_result', handleLotteryResult);
    socket.on('payout_approval_needed', handlePayoutApprovalNeeded);
    socket.on('payout_released', handlePayoutReleased);

    return () => {
      socket.off('membership_reinstated', handleReinstated);
      socket.off('lottery_result', handleLotteryResult);
      socket.off('payout_approval_needed', handlePayoutApprovalNeeded);
      socket.off('payout_released', handlePayoutReleased);
    };
  }, [user, router, incrementUnread]);

  return null;
}
