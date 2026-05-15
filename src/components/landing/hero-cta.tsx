'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect, useState } from 'react';

export function HeroCta() {
  const t = useTranslations('HomePage');
  const authT = useTranslations('Auth');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-dark text-black font-semibold rounded-lg transition-colors text-sm"
        >
          {authT('goToDashboard')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-2">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-dark text-black font-semibold rounded-lg transition-colors text-sm"
      >
        {t('registerMahber')} <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-6 py-3 bg-background-surface hover:bg-background-subtle border border-border text-text-primary font-semibold rounded-lg transition-colors text-sm"
      >
        {authT('signIn')}
      </Link>
    </div>
  );
}
