'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';

export default function LocaleSwitcher() {
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
    <div className="flex gap-2">
      {routing.locales.map((cur) => (
        <button
          key={cur}
          onClick={() => onSelectChange(cur)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            locale === cur
              ? 'bg-gold text-background-dark'
              : 'bg-surface border border-border-glass text-text-secondary hover:text-text-primary'
          }`}
        >
          {cur.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
