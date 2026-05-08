"use client";

import { useTranslations } from "next-intl";
import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Shield,
  CreditCard,
  Globe,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { mahberService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Mahber, UpdateMahberDto } from "@/lib/types";
import toast from "react-hot-toast";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/routing";

export default function MahberSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("MahberSettings");
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [settings, setSettings] = useState<UpdateMahberDto>({
    name: "",
    is_public: true,
    configuration: {
      contribution_amount: 0,
      cycle: "Monthly",
      payment_frequency: "Monthly",
      payment_day: 1,
      join_fee_required: false,
      join_fee_amount: 0,
      penalty_rate: 0,
      penalty_mode: "fixed",
      penalty_interval: "30d",
      max_fine_total: 0,
      operation_cost_rate: 0,
    },
  });

  const { data: mahber, isLoading: isLoadingMahber } = useQuery({
    queryKey: ["mahber-settings", id],
    queryFn: () => mahberService.getMahberById(id),
  });

  const { data: membersResponse, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["mahber-members-check", id],
    queryFn: () => memberService.getMembers(id, 1, 100), // Fetch a good chunk to find self
  });

  // Find current user's membership to check if admin
  const myMembership = membersResponse?.data.find(
    (m) => m.user?.id === user?.id,
  );
  const isAdmin =
    myMembership?.role === "ADMIN" ||
    (myMembership?.role as any)?.name === "Admin" ||
    (myMembership?.role as any)?.permissions?.includes("manage_members");

  useEffect(() => {
    if (mahber) {
      const paymentFrequency =
        mahber.configuration.payment_frequency ??
        mahber.configuration.cycle ??
        "Monthly";

      setSettings({
        name: mahber.name,
        is_public: mahber.is_public,
        configuration: {
          contribution_amount: mahber.configuration.contribution_amount,
          cycle: paymentFrequency,
          payment_frequency: paymentFrequency as any,
          payment_day: mahber.configuration.payment_day ?? 1,
          join_fee_required: mahber.configuration.join_fee_required ?? false,
          join_fee_amount: mahber.configuration.join_fee_amount ?? 0,
          penalty_rate: mahber.configuration.penalty_rate ?? 0,
          penalty_mode: mahber.configuration.penalty_mode ?? "fixed",
          penalty_interval: mahber.configuration.penalty_interval ?? "30d",
          max_fine_total: mahber.configuration.max_fine_total ?? 0,
          operation_cost_rate: mahber.configuration.operation_cost_rate ?? 0,
        },
      });
    }
  }, [mahber]);

  const setPaymentFrequency = (value: string) => {
    setSettings((current) => ({
      ...current,
      configuration: {
        ...(current.configuration ?? {}),
        cycle: value,
        payment_frequency: value as any,
        payment_day: value === 'Weekly' ? 1 : 1,
      } as any,
    }));
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMahberDto) => mahberService.updateMahber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-settings", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber", id] });
      queryClient.invalidateQueries({ queryKey: ["mahbers"] });
      toast.success(t('settingsUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('settingsUpdateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => mahberService.deleteMahber(id),
    onSuccess: () => {
      toast.success(t('mahberDeleted'));
      router.push("/mahbers");
    },
    onError: (error: any) => {
      toast.error(error.message || t('mahberDeleteFailed'));
    },
  });

  const handleSave = () => {
    if (
      mahber?.type === "EQUB" &&
      (settings.configuration?.operation_cost_rate ?? 0) <= 0
    ) {
      toast.error(t('operationCostRequired'));
      return;
    }
    updateMutation.mutate(settings);
  };

  if (isLoadingMahber || isLoadingMembers) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Shield className="w-16 h-16 text-text-muted opacity-20" />
        <h2 className="text-xl font-bold">{t('adminRequired')}</h2>
        <p className="text-text-secondary">
          {t('adminRequiredDesc')}
        </p>
        <Button onClick={() => router.back()}>{t('goBack')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - General Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                {t('generalConfiguration')}
              </CardTitle>
              <CardDescription>
                {t('generalDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('mahberName')}</label>
                <Input
                  value={settings.name}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  className="bg-surface-active border-border-glass"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-active/50 border border-border-glass mt-6">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold" />
                    <span className="font-medium text-sm">
                      {t('publicVisibility')}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {t('publicVisibilityDesc')}
                  </p>
                </div>
                <Switch
                  checked={settings.is_public}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, is_public: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-status-success" />
                {t('financialRules')}
              </CardTitle>
              <CardDescription>
                {t('financialRulesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('contributionAmount')}
                </label>
                <Input
                  type="number"
                  value={settings.configuration?.contribution_amount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      configuration: {
                        ...settings.configuration,
                        contribution_amount: Number(e.target.value),
                      } as any,
                    })
                  }
                  className="bg-surface-active border-border-glass font-mono"
                />
                <p className="text-xs text-text-muted">
                  {t('contributionAmountDesc')}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">{t('paymentFrequency')}</label>
                <select
                  className="w-full bg-surface-active border border-border-glass rounded-input p-2.5 text-sm focus:outline-none focus:border-gold/50"
                  value={settings.configuration?.cycle}
                  onChange={(e) => setPaymentFrequency(e.target.value)}
                >
                  <option value="Daily">{t('daily')}</option>
                  <option value="Weekly">{t('weekly')}</option>
                  <option value="Monthly">{t('monthly')}</option>
                  <option value="Quarterly">{t('quarterly')}</option>
                </select>
              </div>

              {settings.configuration?.cycle === "Weekly" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('paymentDayOfWeek')}</label>
                  <select
                    className="w-full bg-surface-active border border-border-glass rounded-input p-2.5 text-sm focus:outline-none focus:border-gold/50"
                    value={settings.configuration?.payment_day ?? 1}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          payment_day: Number(e.target.value),
                        } as any,
                      })
                    }
                  >
                    <option value={1}>{t('monday')}</option>
                    <option value={2}>{t('tuesday')}</option>
                    <option value={3}>{t('wednesday')}</option>
                    <option value={4}>{t('thursday')}</option>
                    <option value={5}>{t('friday')}</option>
                    <option value={6}>{t('saturday')}</option>
                    <option value={0}>{t('sunday')}</option>
                  </select>
                </div>
              ) : settings.configuration?.cycle === "Monthly" || settings.configuration?.cycle === "Quarterly" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('paymentDayOfMonth')}</label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={settings.configuration?.payment_day ?? 1}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          payment_day: Number(e.target.value),
                        } as any,
                      })
                    }
                    className="bg-surface-active border-border-glass font-mono"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">
                      {t('joinFeeRequired')}
                    </label>
                    <Switch
                      checked={
                        settings.configuration?.join_fee_required ?? false
                      }
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          configuration: {
                            ...settings.configuration,
                            join_fee_required: checked,
                          } as any,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    {t('joinFeeRequiredDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('joinFeeAmount')}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.configuration?.join_fee_amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          join_fee_amount: Number(e.target.value),
                        } as any,
                      })
                    }
                    className="bg-surface-active border-border-glass font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('penaltyRate')}</label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.configuration?.penalty_rate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          penalty_rate: Number(e.target.value),
                        } as any,
                      })
                    }
                    className="bg-surface-active border-border-glass font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('penaltyMode')}</label>
                  <select
                    value={settings.configuration?.penalty_mode ?? "fixed"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          penalty_mode: e.target.value as any,
                        } as any,
                      })
                    }
                    className="w-full bg-surface-active border border-border-glass rounded-input p-2.5 text-sm focus:outline-none focus:border-gold/50"
                  >
                    <option value="fixed">{t('fixed')}</option>
                    <option value="percentage">{t('percentage')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('penaltyInterval')}
                  </label>
                  <Input
                    type="text"
                    value={settings.configuration?.penalty_interval}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          penalty_interval: e.target.value,
                        } as any,
                      })
                    }
                    placeholder={t('penaltyIntervalPlaceholder')}
                    className="bg-surface-active border-border-glass font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">
                  {t('maxFineTotal')}
                </label>
                <Input
                  type="number"
                  min={0}
                  value={settings.configuration?.max_fine_total}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      configuration: {
                        ...settings.configuration,
                        max_fine_total: Number(e.target.value),
                      } as any,
                    })
                  }
                  className="bg-surface-active border-border-glass font-mono"
                />
                <p className="text-xs text-text-muted">
                  {t('maxFineTotalDesc')}
                </p>
              </div>

              {mahber?.type === "EQUB" && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">
                    {t('operationCostRate')}
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={settings.configuration?.operation_cost_rate ?? 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        configuration: {
                          ...settings.configuration,
                          operation_cost_rate: Number(e.target.value),
                        } as any,
                      })
                    }
                    className="bg-surface-active border-border-glass font-mono"
                  />
                  <p className="text-xs text-text-muted">
                    {t('operationCostRateDesc')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Danger Zone */}
        <div className="space-y-6">
          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="text-sm">{t('saveChanges')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSave}
                className="w-full bg-gold hover:bg-gold-dark text-black font-bold"
                isLoading={updateMutation.isPending}
                disabled={!settings.name}
              >
                <Save className="w-4 h-4 mr-2" />
                {t('updateSettings')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="w-full"
              >
                {t('cancel')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-status-error/30 bg-status-error/5">
            <CardHeader>
              <CardTitle className="text-sm text-status-error flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('dangerZone')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted mb-4">
                {t('dangerZoneDesc')}
              </p>
              <Button
                variant="outline"
                className="w-full border-status-error/50 text-status-error hover:bg-status-error/10"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('deleteMahber')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title={t('deleteConfirmTitle')}
        description={t('deleteConfirmDesc', { name: mahber?.name ?? '' })}
      >
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            isLoading={deleteMutation.isPending}
          >
            {t('confirmDelete')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
