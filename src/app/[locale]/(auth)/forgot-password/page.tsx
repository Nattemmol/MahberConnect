'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { authService } from '@/lib/api/service-factory';
import { Button } from '@/components/ui/button';

const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const forgotSchema = z.object({
    phone: z.string().regex(phoneRegex, { message: t('validation.phoneInvalid') }),
  });

  type ForgotFormValues = z.infer<typeof forgotSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { phone: '' }
  });

  const onSubmit = async (data: ForgotFormValues) => {
    try {
      const formattedPhone = data.phone.startsWith('0') ? `+251${data.phone.slice(1)}` : data.phone;
      await authService.forgotPassword(formattedPhone);
      setSent(true);
      toast.success(t('messages.resetCodeSent'));
    } catch (err) {
      const error = err as any;
      toast.error(error.response?.data?.message || error.message || t('messages.resetCodeError'));
    }
  };

  if (sent) {
    const phone = getValues('phone');
    const formattedPhone = phone.startsWith('0') ? `+251${phone.slice(1)}` : phone;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary">{t('checkSmsTitle')}</h2>
          <p className="text-text-secondary mt-1">{t('checkSmsSubtitle')}</p>
        </div>
        <div className="bg-background-dark/30 rounded-lg p-4 text-center">
          <p className="text-sm text-text-secondary">{t('codeSentTo')}</p>
          <p className="text-gold font-medium mt-1">{formattedPhone}</p>
        </div>
        <Button
          className="w-full mt-2"
          onClick={() => router.push(`/reset-password?phone=${encodeURIComponent(formattedPhone)}`)}
        >
          {t('enterResetCode')}
        </Button>
        <div className="text-center text-sm text-text-secondary">
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-gold hover:text-gold-light"
          >
            {t('wrongPhone')}
          </button>
        </div>
        <div className="text-center text-sm text-text-secondary pt-4 border-t border-border-glass">
          <Link href="/login" className="text-gold hover:text-gold-light font-medium">
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary">{t('forgotPasswordTitle')}</h2>
        <p className="text-text-secondary mt-1">{t('forgotPasswordSubtitle')}</p>
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

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          {t('sendResetCode')}
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
