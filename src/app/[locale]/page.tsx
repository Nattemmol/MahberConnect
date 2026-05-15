import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { PublicHeader } from "@/components/layout/public-header";
import { HeroCta } from "@/components/landing/hero-cta";
import {
  Users,
  QrCode,
  ShieldCheck,
  Globe,
  BarChart3,
  Layers,
  ArrowRight,
  XCircle,
} from "lucide-react";

export default function Home() {
  const t = useTranslations('HomePage');
  const commonT = useTranslations('Common');

  const problems = [
    { title: t('prob1Title'), desc: t('prob1Desc') },
    { title: t('prob2Title'), desc: t('prob2Desc') },
    { title: t('prob3Title'), desc: t('prob3Desc') },
  ];

  const features = [
    { icon: Users, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: QrCode, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: BarChart3, title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: Globe, title: t('feat4Title'), desc: t('feat4Desc') },
    { icon: ShieldCheck, title: t('feat5Title'), desc: t('feat5Desc') },
    { icon: Layers, title: t('feat6Title'), desc: t('feat6Desc') },
  ];

  return (
    <div className="min-h-screen bg-background-subtle text-text-primary">
      <PublicHeader />

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 md:pt-28 md:pb-32 flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold tracking-wide uppercase">
            {t('heroBadge')}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary leading-tight max-w-3xl">
            {t('heroTitle1')} <span className="text-gold">{t('heroTitle2')}</span> {t('heroTitle3')} <span className="text-gold">{t('heroTitle4')}</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
            {t('heroDesc')}
          </p>
        <HeroCta />
      </section>

      {/* PROBLEM */}
      <section className="bg-background-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">{t('problemTitle')}</h2>
            <p className="text-text-secondary leading-relaxed">{t('problemDesc')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-border bg-background-subtle space-y-3">
                <div className="w-8 h-8 rounded-lg bg-status-error/10 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-status-error" />
                </div>
                <h3 className="font-semibold text-text-primary">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-20 md:py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">{t('featuresTitle')}</h2>
            <p className="text-text-secondary leading-relaxed">{t('featuresDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-xl border border-border bg-background-surface hover:border-gold/40 hover:shadow-sm transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gold">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-black">{t('ctaTitle')}</h2>
          <p className="text-black/70 max-w-xl mx-auto text-sm leading-relaxed">{t('ctaDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-black/80 transition-colors text-sm">
              {t('registerMahber')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 border border-black/10 text-black font-semibold rounded-lg transition-colors text-sm">
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background-surface border-t border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
                  <span className="text-gold font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-text-primary">{commonT('appName')}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{t('footerTagline')}</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">{t('footerPlatform')}</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="#features" className="hover:text-text-primary transition-colors">{commonT('features')}</a></li>
                <li><Link href="/register" className="hover:text-text-primary transition-colors">{t('getStarted')}</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">{t('footerProject')}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{t('footerProjectDesc')}</p>
              <p className="text-xs text-text-muted">{t('footerLanguages')}</p>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <p>{t('footerRights')}</p>
            <p>{t('footerBuiltWith')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}