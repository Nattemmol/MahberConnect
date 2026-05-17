"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Settings, 
  Shield, 
  CreditCard, 
  Globe, 
  Trash2, 
  Save, 
  AlertTriangle 
} from "lucide-react";
import { mahberService, memberService } from "@/lib/api/service-factory";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
      cycle: "Monthly"
    }
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
  const myMembership = membersResponse?.data.find(m => m.user?.id === user?.id);
  const isAdmin = myMembership?.role === "ADMIN" || 
                 (myMembership?.role as any)?.name === "Admin" || 
                 (myMembership?.role as any)?.permissions?.includes("manage_members");

  useEffect(() => {
    if (mahber) {
      setSettings({
        name: mahber.name,
        is_public: mahber.is_public,
        configuration: {
          contribution_amount: mahber.configuration.contribution_amount,
          cycle: mahber.configuration.cycle
        }
      });
    }
  }, [mahber]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMahberDto) => mahberService.updateMahber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mahber-settings", id] });
      queryClient.invalidateQueries({ queryKey: ["mahber", id] });
      queryClient.invalidateQueries({ queryKey: ["mahbers"] });
      toast.success("Settings updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => mahberService.deleteMahber(id),
    onSuccess: () => {
      toast.success("Mahber deleted successfully");
      router.push("/mahbers");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete Mahber");
    },
  });

  const handleSave = () => {
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
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-text-secondary">You don't have permission to modify this Mahber's settings.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Mahber Settings"
        description="Configure your organization's core settings and rules."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - General Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                General Configuration
              </CardTitle>
              <CardDescription>
                Basic information about your Mahber.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mahber Name</label>
                <Input 
                  value={settings.name}
                  onChange={(e) => setSettings({...settings, name: e.target.value})}
                  className="bg-surface-active border-border-glass"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-active/50 border border-border-glass mt-6">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold" />
                    <span className="font-medium text-sm">Public Visibility</span>
                  </div>
                  <p className="text-xs text-text-muted">
                    When public, others can discover and request to join your Mahber.
                  </p>
                </div>
                <Switch 
                  checked={settings.is_public}
                  onCheckedChange={(checked) => setSettings({...settings, is_public: checked})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-status-success" />
                Financial Rules
              </CardTitle>
              <CardDescription>
                Configure contribution amounts and payment cycles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contribution Amount (ETB)</label>
                <Input 
                  type="number"
                  value={settings.configuration?.contribution_amount}
                  onChange={(e) => setSettings({
                    ...settings, 
                    configuration: { 
                      ...settings.configuration, 
                      contribution_amount: Number(e.target.value) 
                    }
                  })}
                  className="bg-surface-active border-border-glass font-mono"
                />
                <p className="text-xs text-text-muted">
                  This is the standard amount members are expected to pay each cycle.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Payment Cycle</label>
                <select 
                  className="w-full bg-surface-active border border-border-glass rounded-input p-2.5 text-sm focus:outline-none focus:border-gold/50"
                  value={settings.configuration?.cycle}
                  onChange={(e) => setSettings({
                    ...settings, 
                    configuration: { 
                      ...settings.configuration, 
                      cycle: e.target.value 
                    }
                  })}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Danger Zone */}
        <div className="space-y-6">
          <Card className="glass border-border-glass">
            <CardHeader>
              <CardTitle className="text-sm">Save Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleSave} 
                className="w-full bg-gold hover:bg-gold-dark text-black font-bold"
                isLoading={updateMutation.isPending}
                disabled={!settings.name}
              >
                <Save className="w-4 h-4 mr-2" />
                Update Settings
              </Button>
              <Button variant="ghost" onClick={() => router.back()} className="w-full">
                Cancel
              </Button>
            </CardContent>
          </Card>

          <Card className="border-status-error/30 bg-status-error/5">
            <CardHeader>
              <CardTitle className="text-sm text-status-error flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted mb-4">
                Deleting this Mahber is permanent and cannot be undone. All financial records will be lost.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-status-error/50 text-status-error hover:bg-status-error/10"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Mahber
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will permanently delete the ${mahber?.name} and remove all member data.`}
      >
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => deleteMutation.mutate()}
            isLoading={deleteMutation.isPending}
          >
            Confirm Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
