import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames, exclude static files
  matcher: ['/', '/(am|en)/:path*', '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico|.*\\.json|.*\\.js|.*\\.css).*)']
};
