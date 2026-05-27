'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { authService } from '@/lib/api/service-factory';
import { Button } from '@/components/ui/button';

const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPasswordPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams?.get('phone') || '';

  const resetSchema = z.object({
    phone: z.string().regex(phoneRegex, { message: t('validation.phoneInvalid') }),
    code: z.string().length(6, { message: t('validation.codeInvalid') }),
    newPassword: z.string().regex(passwordRegex, { message: t('validation.passwordComplex') }),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordsMatch'),
    path: ["confirmPassword"],
  });

  type ResetFormValues = z.infer<typeof resetSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { phone: phoneParam, code: '', newPassword: '', confirmPassword: '' }
  });

  const onSubmit = async (data: ResetFormValues) => {
    try {
      const formattedPhone = data.phone.startsWith('0') ? `+251${data.phone.slice(1)}` : data.phone;
      await authService.resetPassword(formattedPhone, data.code, data.newPassword);
      toast.success(t('messages.resetSuccess'));
      router.push('/login');
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || error.message || t('messages.resetError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">{t('resetPasswordTitle')}</h2>
        <p className="text-text-secondary mt-1">{t('resetPasswordSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('phone')}</label>
          <input
            type="tel"
            placeholder="+251 911 234 567"
            {...register('phone')}
            className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.phone ? 'border-status-error' : 'border-border-glass'} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
          />
          {errors.phone && <p className="text-status-error text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('resetCode')}</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="482916"
            {...register('code')}
            className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.code ? 'border-status-error' : 'border-border-glass'} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors text-center text-lg tracking-widest`}
          />
          {errors.code && <p className="text-status-error text-xs mt-1">{errors.code.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('newPassword')}</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('newPassword')}
            className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.newPassword ? 'border-status-error' : 'border-border-glass'} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
          />
          {errors.newPassword && <p className="text-status-error text-xs mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">{t('confirmPassword')}</label>
          <input
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            className={`w-full px-4 py-3 bg-background-dark/50 border ${errors.confirmPassword ? 'border-status-error' : 'border-border-glass'} rounded-input text-text-primary focus:outline-none focus:border-gold transition-colors`}
          />
          {errors.confirmPassword && <p className="text-status-error text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          {t('resetPassword')}
        </Button>
      </form>

      <div className="text-center text-sm text-text-secondary pt-4 border-t border-border-glass">
        <Link href="/login" className="text-gold hover:text-gold-light font-medium">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  );
}
