import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import LocaleSwitcher from '@/components/layout/locale-switcher';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold text-gold drop-shadow-lg mb-6">
          {t('title')}
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary mb-12">
          {t('description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-4 bg-gold text-[#0A0F0A] font-semibold rounded-input hover:bg-gold-light transition-colors text-lg">
            {t('login')}
          </Link>
          <Link href="/register" className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border-glass text-text-primary font-semibold rounded-input transition-colors text-lg">
            {t('createAccount')}
          </Link>
        </div>
      </div>
    </main>
  );
}
