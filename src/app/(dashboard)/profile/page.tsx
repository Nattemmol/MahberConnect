'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api/services/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Phone, Mail, Calendar, Info, ShieldCheck, User as UserIcon, Edit2, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user: storeUser, updateUser, logout } = useAuthStore();
  const [user, setUser] = useState<User | null>(storeUser);
  const [loading, setLoading] = useState(!storeUser);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await authApi.getProfile();
        setUser(profileData);
        updateUser(profileData);
        setEditForm({
          name: profileData.name || '',
          email: profileData.email || '',
          bio: profileData.bio || ''
        });
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [updateUser]);

  const handleEditToggle = () => {
    if (!isEditing && user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await authApi.updateProfile({
        name: editForm.name,
        email: editForm.email || null,
        bio: editForm.bio || null
      });
      setUser(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      toast?.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast?.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="p-4 bg-red-500/10 rounded-full text-red-500">
          <Info className="w-8 h-8" />
        </div>
        <p className="text-red-500 font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Profile Section */}
      <motion.div variants={itemVariants} className="relative mt-4">
        <div className="h-48 w-full rounded-3xl bg-gradient-to-br from-yellow-600/20 via-yellow-700/10 to-yellow-900/20 border border-gold/10 backdrop-blur-md overflow-hidden relative shadow-lg">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute top-12 left-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="absolute -bottom-16 left-8 flex items-end space-x-6 z-10">
          <Avatar className="w-32 h-32 border-4 border-background shadow-2xl ring-4 ring-gold/10">
            <AvatarFallback className="text-4xl bg-gradient-to-br from-zinc-800 to-black text-gold border border-gold/20">{initials}</AvatarFallback>
          </Avatar>
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2 drop-shadow-md">
              {user.name}
              <ShieldCheck className="w-6 h-6 text-gold" />
            </h1>
            <p className="text-gold/80 flex items-center gap-2 mt-1 font-medium tracking-wide">
              MEMBER
            </p>
          </div>
        </div>
        
        <div className="absolute top-6 right-6">
          <Button variant="destructive" size="sm" onClick={logout} className="rounded-full shadow-lg hover:shadow-xl transition-all border border-red-500/20 hover:border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </motion.div>

      <div className="h-16"></div> {/* Spacer for the avatar overlap */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-0">
        <motion.div variants={itemVariants} className="md:col-span-2 space-y-8">
          <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full -z-10 blur-xl"></div>
            <CardHeader className="border-b border-border-glass bg-background/20 flex flex-row items-center justify-between pb-6">
              <div className="space-y-1.5">
                <CardTitle className="text-2xl flex items-center gap-2 font-semibold">
                  <UserIcon className="w-6 h-6 text-gold" />
                  Personal Details
                </CardTitle>
                <CardDescription className="text-text-secondary/80">Manage your personal information and contact details.</CardDescription>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEditToggle} className="rounded-full border-gold/30 text-gold hover:bg-gold/10 hover:text-gold">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleEditToggle} disabled={isSaving} className="rounded-full text-text-secondary">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-full bg-gold hover:bg-yellow-600 text-black font-semibold">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Full Name */}
                <div className="space-y-2 group col-span-1 sm:col-span-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gold/50 group-hover:text-gold transition-colors" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input 
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background/50 border-gold/30 focus-visible:ring-gold/50 rounded-xl"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="font-semibold text-lg bg-background/50 p-4 rounded-2xl border border-border-glass shadow-inner group-hover:border-gold/20 transition-all">
                      {user.name}
                    </div>
                  )}
                </div>

                {/* Phone - Read Only */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gold/50 group-hover:text-gold transition-colors" />
                    Phone Number
                  </label>
                  <div className={`font-semibold text-lg bg-background/50 p-4 rounded-2xl border border-border-glass shadow-inner transition-all ${isEditing ? 'opacity-70 cursor-not-allowed' : 'group-hover:border-gold/20'}`}>
                    {user.phone}
                    {isEditing && <span className="block text-xs text-text-secondary/70 mt-1 font-normal">Phone cannot be edited</span>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold/50 group-hover:text-gold transition-colors" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input 
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-background/50 border-gold/30 focus-visible:ring-gold/50 rounded-xl"
                      placeholder="name@example.com"
                    />
                  ) : (
                    <div className="font-semibold text-lg bg-background/50 p-4 rounded-2xl border border-border-glass truncate shadow-inner group-hover:border-gold/20 transition-all">
                      {user.email || <span className="text-text-secondary/40 italic font-normal">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 group pt-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Info className="w-4 h-4 text-gold/50 group-hover:text-gold transition-colors" />
                  Biography
                </label>
                {isEditing ? (
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full min-h-[120px] p-4 bg-background/50 border border-gold/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 rounded-2xl text-base shadow-inner resize-y transition-all"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="text-base bg-background/50 p-5 rounded-2xl border border-border-glass leading-relaxed min-h-[120px] shadow-inner group-hover:border-gold/20 transition-all">
                    {user.bio || <span className="text-text-secondary/40 italic font-normal">No biography provided yet. Update your profile to tell us about yourself!</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          <Card className="border-gold/10 bg-surface/40 backdrop-blur-xl hover:shadow-lg hover:shadow-gold/5 transition-all duration-300">
            <CardHeader className="border-b border-border-glass bg-background/20">
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Calendar className="w-5 h-5 text-gold" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="flex items-center space-x-4 group">
                <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20 group-hover:bg-gold/20 group-hover:scale-110 transition-all shadow-sm">
                  <Calendar className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gold/80 uppercase tracking-wider mb-1">Member Since</p>
                  <p className="font-bold text-text-primary">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="p-3 bg-gold/10 rounded-2xl border border-gold/20 group-hover:bg-gold/20 group-hover:scale-110 transition-all shadow-sm">
                  <Info className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gold/80 uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="font-bold text-text-primary">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
