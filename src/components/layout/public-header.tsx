'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import LocaleSwitcher from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export function PublicHeader() {
  const pathname = usePathname();
  const t = useTranslations('HomePage');
  const authT = useTranslations('Auth');
  const commonT = useTranslations('Common');
  const isLanding = pathname === '/';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  // Avoid hydration mismatch — auth state comes from localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background-surface/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/Mahber_Connect_Logo.svg"
            alt="MahberConnect"
            width={250}
            height={120}
            unoptimized
            className="h-20 w-auto"
          />
        </Link>

        {/* Nav links — only on landing page */}
        {isLanding && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">{commonT('features')}</a>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />

          {mounted && (
            isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-gold hover:bg-gold-dark text-black font-semibold">
                  {authT('goToDashboard')}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                    {authT('signIn')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gold hover:bg-gold-dark text-black font-semibold">
                    {t('getStarted')}
                  </Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
