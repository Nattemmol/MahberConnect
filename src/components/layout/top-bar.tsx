'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { Bell, Menu, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/ui-store';
import LocaleSwitcher from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function TopBar() {
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { toggleSidebar } = useUIStore();

  const segments = pathname.split('/').filter(Boolean);
  const title =
    segments.length > 0
      ? segments[segments.length - 1]
          .charAt(0)
          .toUpperCase() +
        segments[segments.length - 1].slice(1).replace(/-/g, ' ')
      : 'Dashboard';

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background-surface/80 backdrop-blur-md sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden text-text-secondary" onClick={toggleSidebar}>
          <Menu className="w-5 h-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <h1 className="md:hidden text-base font-semibold text-text-primary capitalize truncate max-w-[160px]">
          {title}
        </h1>

        {/* Desktop search */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 h-9 w-56 bg-background-subtle border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <LocaleSwitcher />

        <Button
          variant="ghost"
          size="icon"
          className="relative text-text-secondary hover:text-text-primary hover:bg-background-subtle"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-status-error rounded-full" />
        </Button>

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
