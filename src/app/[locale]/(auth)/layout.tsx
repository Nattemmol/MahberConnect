'use client';

import { Link } from '@/i18n/routing';
import { PublicHeader } from '@/components/layout/public-header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background-subtle">
      <PublicHeader />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-2xl font-bold text-gold">
              MahberConnect
            </Link>
            <p className="text-text-secondary mt-1 text-sm">Community Association Management</p>
          </div>

          <div className="bg-background-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
