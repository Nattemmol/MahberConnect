'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Bell, User } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const links = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/mahbers', label: t('myMahbers'), icon: Users },
    { href: '/notifications', label: t('notifications'), icon: Bell },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  return (
    <nav className="md:hidden border-t border-border bg-background-surface/90 backdrop-blur-md z-50">
      <div className="flex">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-3 gap-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-gold' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-gold' : '')} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
