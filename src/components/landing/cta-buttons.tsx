'use client';

import { Link } from '@/i18n/routing';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect, useState } from 'react';

export function CtaButtons() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (isAuthenticated) {
    return (
      <div className="flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-black/80 transition-colors text-sm"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-black/80 transition-colors text-sm"
      >
        Register Your Mahber <ArrowRight className="w-4 h-4" />
      </Link>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 border border-black/10 text-black font-semibold rounded-lg transition-colors text-sm"
      >
        Sign In
      </Link>
    </div>
  );
}
