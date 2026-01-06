import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Clock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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

const Settings = () => {
  const { user, logout } = useData();
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: '+1 (555) 123-4567',
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
    sessionTimeout: '30',
  });

  const handleSaveProfile = () => {
    toast({
      title: 'Profile updated',
      description: 'Your profile changes have been saved.',
    });
  };

  const handleChangePassword = () => {
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
    toast({
      title: 'Password changed',
      description: 'Your password has been updated successfully.',
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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

      {/* Settings Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Shield className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-2 text-destructive data-[state=active]:text-destructive">
              <Trash2 className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-2 border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {user.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6" />
                  </button>
                </div>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator className="my-6" />

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
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="pl-10"
                    />
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
                  <Button variant="outline" onClick={handleChangePassword}>
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for important updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, emailNotifications: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.twoFactorAuth}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, twoFactorAuth: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after inactivity
                      </p>
                    </div>
                  </div>
                  <Select
                    value={preferences.sessionTimeout}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, sessionTimeout: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default Settings;
