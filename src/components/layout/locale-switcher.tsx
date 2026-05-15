'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const onSelectChange = (nextLocale: string) => {
    router.replace(
      // @ts-expect-error -- pathname is checked by createNavigation
      { pathname, params },
      { locale: nextLocale }
    );
  };

  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-background-subtle border border-border">
      {routing.locales.map((cur) => (
        <button
          key={cur}
          onClick={() => onSelectChange(cur)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
            locale === cur
              ? 'bg-gold text-black shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          {t(cur)}
        </button>
      ))}
    </div>
  );
}
