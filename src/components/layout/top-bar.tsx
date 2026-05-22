'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Bell, Menu, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/ui-store';
import LocaleSwitcher from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useState, useEffect } from 'react';
import { notificationService } from '@/lib/api/service-factory';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/lib/stores/auth-store';

import { useNotificationStore } from '@/lib/stores/notification-store';

export function TopBar() {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  
  const { unreadCount, setUnreadCount, incrementUnreadCount } = useNotificationStore();

  const segments = pathname.split('/').filter(Boolean);
  const title =
    segments.length > 0
      ? segments[segments.length - 1]
        .charAt(0)
        .toUpperCase() +
      segments[segments.length - 1].slice(1).replace(/-/g, ' ')
      : 'Dashboard';

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications();
        setUnreadCount(notifications.filter(n => !n.is_read).length);
      } catch (error) {
        // Suppress console error to avoid spamming logs if unauthenticated
      }
    };
    
    checkNotifications();

    // Initialize socket connection
    const socket = socketService.connect();
    
    if (user?.id && socket) {
      socketService.joinUserRoom(user.id);
      
      const handleNewNotification = () => {
        incrementUnreadCount();
      };
      
      socket.on('new_notification', handleNewNotification);
      
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [user?.id, setUnreadCount, incrementUnreadCount]);

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background-surface/80 backdrop-blur-md sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden text-text-secondary" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
          <span className="sr-only">{t('toggleMenu')}</span>
        </Button>

        <h1 className="md:hidden text-base font-semibold text-text-primary capitalize truncate max-w-[160px]">
          {title === 'Dashboard' ? t('title') : title}
        </h1>


      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher />

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-text-secondary hover:text-text-primary hover:bg-background-subtle"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-error text-[10px] font-bold text-white shadow-sm ring-2 ring-background-surface">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <Link href="/profile" className="ml-1">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-gold/50 transition-all">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="text-xs bg-gold/10 text-gold font-semibold">AK</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
