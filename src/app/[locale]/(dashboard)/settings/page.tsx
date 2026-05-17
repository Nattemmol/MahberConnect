'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter, usePathname, routing } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { authApi } from '@/lib/api/services/auth.api';
import { notificationService } from '@/lib/api/service-factory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Globe,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Shield,
  LogOut,
  Check,
  Lock,
  Smartphone,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout, user } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({
    payments: true,
    events: true,
    announcements: true,
    chat: false,
  });

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification state
  const [generalNotifications, setGeneralNotifications] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLocaleChange = (nextLocale: string) => {
    router.replace(
      // @ts-expect-error -- pathname is checked by createNavigation
      { pathname, params },
      { locale: nextLocale }
    );
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error(t('fillAllFields'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success(t('passwordChanged'));
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleGeneral = async () => {
    if (!user) {
      toast.error("Please log in to manage notifications");
      return;
    }
    
    const nextState = !generalNotifications;
    setIsRegistering(true);
    try {
      if (nextState) {
        await notificationService.registerDevice({
          token: "fcm-token-abc123",
          platform: "web",
          userId: user.id
        });
      } else {
        await notificationService.unregisterDevice({
          token: "fcm-token-abc123",
          userId: user.id
        });
      }
      setGeneralNotifications(nextState);
      toast.success(nextState ? "Push notifications enabled" : "Push notifications disabled");
    } catch (error) {
      toast.error("Failed to update notification settings");
    } finally {
      setIsRegistering(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const themeOptions = [
    { value: 'light', label: t('light'), icon: Sun },
    { value: 'dark', label: t('dark'), icon: Moon },
    { value: 'system', label: t('system'), icon: Monitor },
  ];

  const localeLabels: Record<string, { name: string; nativeName: string }> = {
    en: { name: 'English', nativeName: 'English' },
    am: { name: 'Amharic', nativeName: 'አማርኛ' },
  };

  return (
    <motion.div
      className="max-w-3xl mx-auto space-y-6 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="mt-2">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <div className="p-2.5 bg-gold/10 rounded-2xl border border-gold/20">
            <Settings className="w-7 h-7 text-gold" />
          </div>
          {t('title')}
        </h1>
        <p className="text-text-secondary mt-2 ml-[52px]">{t('subtitle')}</p>
      </motion.div>

      {/* Language Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 overflow-hidden">
          <CardHeader className="border-b border-border-glass bg-background/20 pb-5">
            <CardTitle className="text-xl flex items-center gap-2.5 font-semibold">
              <Globe className="w-5 h-5 text-gold" />
              {t('language')}
            </CardTitle>
            <CardDescription className="text-text-secondary/80">
              {t('languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routing.locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left group ${
                    locale === loc
                      ? 'border-gold/50 bg-gold/5 shadow-sm shadow-gold/10'
                      : 'border-border-glass bg-background/30 hover:border-gold/20 hover:bg-background/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 transition-all ${
                      locale === loc
                        ? 'bg-gold/15 text-gold'
                        : 'bg-background-subtle text-text-muted group-hover:text-text-secondary'
                    }`}
                  >
                    {loc === 'en' ? '🇬🇧' : '🇪🇹'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${locale === loc ? 'text-gold' : 'text-text-primary'}`}>
                      {localeLabels[loc]?.nativeName || loc}
                    </p>
                    <p className="text-sm text-text-secondary/70">
                      {localeLabels[loc]?.name || loc}
                    </p>
                  </div>
                  {locale === loc && (
                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 overflow-hidden">
          <CardHeader className="border-b border-border-glass bg-background/20 pb-5">
            <CardTitle className="text-xl flex items-center gap-2.5 font-semibold">
              {mounted && resolvedTheme === 'dark' ? (
                <Moon className="w-5 h-5 text-gold" />
              ) : (
                <Sun className="w-5 h-5 text-gold" />
              )}
              {t('appearance')}
            </CardTitle>
            <CardDescription className="text-text-secondary/80">
              {t('appearanceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = mounted && resolvedTheme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-200 group ${
                      isActive
                        ? 'border-gold/50 bg-gold/5 shadow-sm shadow-gold/10'
                        : 'border-border-glass bg-background/30 hover:border-gold/20 hover:bg-background/50'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gold/15 text-gold scale-110'
                          : 'bg-background-subtle text-text-muted group-hover:text-text-secondary group-hover:scale-105'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? 'text-gold' : 'text-text-secondary'
                      }`}
                    >
                      {option.label}
                    </span>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 overflow-hidden">
          <CardHeader className="border-b border-border-glass bg-background/20 pb-5">
            <CardTitle className="text-xl flex items-center gap-2.5 font-semibold">
              <Bell className="w-5 h-5 text-gold" />
              {t('notifications')}
            </CardTitle>
            <CardDescription className="text-text-secondary/80">
              {t('notificationsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-2">
            {/* General Push Notifications Toggle */}
            <div className="flex items-center justify-between py-5 px-2 mb-2 border-b border-border-glass bg-gold/5 rounded-xl mx-2 mt-2">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                  <Bell className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{t('pushNotifications')}</p>
                  <p className="text-xs text-text-secondary/80 mt-0.5">{t('pushNotificationsDesc')}</p>
                </div>
              </div>
              <button
                onClick={handleToggleGeneral}
                disabled={isRegistering}
                className={`relative w-12 h-6.5 rounded-full transition-all duration-300 shrink-0 ${
                  generalNotifications
                    ? 'bg-gold shadow-md shadow-gold/30'
                    : 'bg-background-subtle border border-border-glass'
                } ${isRegistering ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`absolute top-0.5 w-5.5 h-5.5 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center ${
                    generalNotifications
                      ? 'left-[24px] bg-black'
                      : 'left-0.5 bg-text-muted'
                  }`}
                >
                  {isRegistering && <Loader2 className={`w-3 h-3 animate-spin ${generalNotifications ? 'text-gold' : 'text-white'}`} />}
                </div>
              </button>
            </div>

            {[
              {
                key: 'payments' as const,
                label: t('paymentNotifications'),
                desc: t('paymentNotificationsDesc'),
                icon: Smartphone,
              },
              {
                key: 'events' as const,
                label: t('eventNotifications'),
                desc: t('eventNotificationsDesc'),
                icon: Bell,
              },
              {
                key: 'announcements' as const,
                label: t('announcementNotifications'),
                desc: t('announcementNotificationsDesc'),
                icon: Mail,
              },
              {
                key: 'chat' as const,
                label: t('chatNotifications'),
                desc: t('chatNotificationsDesc'),
                icon: BellOff,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-4 px-2 group ${
                    index !== 3 ? 'border-b border-border-glass/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-background-subtle rounded-xl border border-border-glass group-hover:border-gold/20 transition-all">
                      <Icon className="w-4 h-4 text-text-muted group-hover:text-gold transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{item.label}</p>
                      <p className="text-xs text-text-secondary/70 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ${
                      notifications[item.key]
                        ? 'bg-gold shadow-sm shadow-gold/30'
                        : 'bg-background-subtle border border-border-glass'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${
                        notifications[item.key]
                          ? 'left-[22px] bg-black'
                          : 'left-0.5 bg-text-muted'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 overflow-hidden">
          <CardHeader className="border-b border-border-glass bg-background/20 pb-5">
            <CardTitle className="text-xl flex items-center gap-2.5 font-semibold">
              <Shield className="w-5 h-5 text-gold" />
              {t('security')}
            </CardTitle>
            <CardDescription className="text-text-secondary/80">
              {t('securityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-2">
            {/* Change Password Row */}
            <div className="py-4 px-2">
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center justify-between w-full group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-background-subtle rounded-xl border border-border-glass group-hover:border-gold/20 transition-all">
                    <Lock className="w-4 h-4 text-text-muted group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{t('changePassword')}</p>
                    <p className="text-xs text-text-secondary/70 mt-0.5">{t('changePasswordDesc')}</p>
                  </div>
                </div>
                <div className={`transition-transform duration-200 ${showPasswordForm ? 'rotate-45' : ''}`}>
                  {showPasswordForm ? (
                    <X className="w-4 h-4 text-text-muted" />
                  ) : (
                    <Lock className="w-4 h-4 text-text-muted group-hover:text-gold transition-colors" />
                  )}
                </div>
              </button>

              {/* Expandable Password Form */}
              <AnimatePresence>
                {showPasswordForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 ml-[52px] space-y-4">
                      {/* Current Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                          {t('currentPassword')}
                        </label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                            className="bg-background/50 border-border-glass focus-visible:ring-gold/50 rounded-xl pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                          {t('newPassword')}
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                            className="bg-background/50 border-border-glass focus-visible:ring-gold/50 rounded-xl pr-10"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                          {t('confirmNewPassword')}
                        </label>
                        <Input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className="bg-background/50 border-border-glass focus-visible:ring-gold/50 rounded-xl"
                          placeholder="••••••••"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-1">
                        <Button
                          size="sm"
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="rounded-full bg-gold hover:bg-yellow-600 text-black font-semibold"
                        >
                          {isChangingPassword ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          {t('updatePassword')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          disabled={isChangingPassword}
                          className="rounded-full text-text-secondary"
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border-red-500/10 bg-surface/40 backdrop-blur-xl overflow-hidden">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm">{t('signOut')}</p>
                  <p className="text-xs text-text-secondary/70 mt-0.5">
                    {t('signOutDesc')}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="rounded-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500/50 transition-all"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                {t('signOut')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
