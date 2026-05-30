'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePathname, useRouter } from '@/i18n/routing';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password');
    const isPublicRoute = pathname === '/' || isAuthRoute;
    const isSuperAdminRoute = pathname === '/super-admin' || pathname.startsWith('/super-admin/');

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.replace('/dashboard');
    } else if (
      isAuthenticated &&
      isSuperAdminRoute &&
      user !== null &&
      user.is_super_admin !== true
    ) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, pathname, router, mounted, user]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null; // Or a full-page loading spinner
  }

  return <>{children}</>;
}
