import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Briefcase,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { usersApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const ROLES = [
  'AI Adoption Specialist',
  'AI Executor',
  'AI Associate Executor',
  'AI Intern',
];

const Settings = () => {
  const { user, logout } = useData();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    twoFactorAuth: false,
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile changes have been saved.',
    });
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Failed to change password',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    logout();
    toast({
      title: 'Account deleted',
      description: 'Your account has been permanently deleted.',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-4xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </motion.div>

      {/* Settings Content */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

          {/* Name Display */}
          <div className="mb-6">
            <h3 className="font-medium text-xl">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={profileForm.role}
                  onValueChange={(value) => setProfileForm({ ...profileForm, role: value })}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="btn-primary" onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone - moved from separate tab */}
        <div className="glass-card p-6 border-destructive/30">
          <h2 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-muted-foreground mb-6">
            These actions are irreversible. Please proceed with caution.
          </p>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data including clients and credentials from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
