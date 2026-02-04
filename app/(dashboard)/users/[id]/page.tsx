'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AdminOnly, SuperAdminOnly, RoleGuard } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  Key,
  Mail,
  AlertCircle,
  UserX,
  UserCheck,
  Trash2,
  Edit,
  Building,
  Calendar,
  Clock
} from 'lucide-react';
import type { UserResponse, BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePasswordStrength } from '@/lib/utils';
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

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();
  const userId = Number(params.id);
  const t = useTranslations('users.detail');
  const tCommon = useTranslations('common');
  const tPwValidation = useTranslations('common.passwordValidation');

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState(validatePasswordStrength(''));

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const canManageUser = isSuperAdmin || isManager;

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUser(userId);
      setUser(data);
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
      });
    } catch (err) {
      console.error('Failed to load user:', err);
      setError(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePasswordStrength(newPassword));
    }
  }, [newPassword]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.users') || 'Users', href: '/users' },
    { label: user ? `${user.firstName} ${user.lastName}` : tCommon('loading'), isCurrentPage: true }
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tutor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'platform_coordinator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'professor':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'student':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.email?.trim()) {
      errors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = t('emailInvalid');
    }

    if (!editForm.firstName?.trim()) {
      errors.firstName = t('firstNameRequired');
    }

    if (!editForm.lastName?.trim()) {
      errors.lastName = t('lastNameRequired');
    }

    if (!editForm.username?.trim()) {
      errors.username = t('usernameRequired');
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    setIsUpdating(true);
    try {
      await apiClient.updateUser(userId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        username: editForm.username,
      });
      toast.success(t('updateSuccess'));
      setIsEditing(false);
      loadUser();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      if (err.message?.includes('username')) {
        setEditErrors({ username: t('usernameExists') });
      } else if (err.message?.includes('email')) {
        setEditErrors({ email: t('emailExists') });
      } else {
        toast.error(err.message || t('updateError'));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordValidation.isValid) {
      toast.error(tPwValidation(passwordValidation.messageKey));
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.put(`/api/users/${userId}/password`, { newPassword });
      toast.success(t('passwordResetSuccess'));
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      toast.error(err.message || t('passwordResetError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      if (user.isActive) {
        await apiClient.deactivateUser(userId);
        toast.success(t('deactivateSuccess'));
      } else {
        await apiClient.activateUser(userId);
        toast.success(t('activateSuccess'));
      }
      loadUser();
    } catch (err: any) {
      console.error('Failed to toggle user status:', err);
      toast.error(err.message || t('toggleStatusError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await apiClient.deleteUserPermanently(userId);
      toast.success(t('deleteSuccess'));
      router.push('/users');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      toast.error(err.message || t('deleteError'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error || t('userNotFound')}</p>
        <Button onClick={() => router.push('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToUsers')}
        </Button>
      </div>
    );
  }

  return (
    <AdminOnly fallback={
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t('noAccess')}</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToDashboard')}
        </Button>
      </div>
    }>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title={`${user.firstName} ${user.lastName}`}
          description={t('description', { role: tCommon(`roles.${user.userType}`) })}
          breadcrumbs={breadcrumbs}
        >
          <Button variant="outline" onClick={() => router.push('/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToUsers')}
          </Button>
        </PageHeader>

        {/* User Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('userInfo')}</CardTitle>
              <CardDescription>{t('userInfoDescription')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getRoleBadgeColor(user.userType)}>
                {tCommon(`roles.${user.userType}`)}
              </Badge>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? t('active') : t('inactive')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      disabled={isUpdating}
                    />
                    {editErrors.firstName && (
                      <p className="text-sm text-destructive">{editErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
                      disabled={isUpdating}
                    />
                    {editErrors.lastName && (
                      <p className="text-sm text-destructive">{editErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">{t('usernameLabel')}</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => handleEditChange('username', e.target.value)}
                    disabled={isUpdating}
                  />
                  {editErrors.username && (
                    <p className="text-sm text-destructive">{editErrors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    disabled={isUpdating}
                  />
                  {editErrors.email && (
                    <p className="text-sm text-destructive">{editErrors.email}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUpdating}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('usernameLabel')}</p>
                    <p className="font-medium">{user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('emailLabel')}</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('firstNameLabel')}</p>
                    <p className="font-medium">{user.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('lastNameLabel')}</p>
                    <p className="font-medium">{user.lastName}</p>
                  </div>
                </div>
                {user.universityName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('universityLabel')}:</span>
                    <span className="font-medium">{user.universityName}</span>
                  </div>
                )}
                <div className="flex gap-4">
                  {user.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('createdAt')}:</span>
                      <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {user.lastLoginAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t('lastLogin')}:</span>
                      <span className="text-sm">{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card - Only for users who can manage */}
        {canManageUser && !isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>{t('actions')}</CardTitle>
              <CardDescription>{t('actionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Edit Button - Super Admin Only */}
              <SuperAdminOnly>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsEditing(true)}
                  disabled={isUpdating}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('editUser')}
                </Button>
              </SuperAdminOnly>

              {/* Password Reset */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  disabled={isUpdating}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {t('resetPassword')}
                </Button>

                {showPasswordReset && (
                  <div className="ml-6 space-y-3 p-4 border rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('newPasswordLabel')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('newPasswordPlaceholder')}
                        disabled={isUpdating}
                      />
                    </div>
                    {newPassword && (
                      <Alert className={passwordValidation.isValid
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                      }>
                        <AlertCircle className={`h-4 w-4 ${passwordValidation.isValid
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                        }`} />
                        <AlertDescription className={passwordValidation.isValid
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-amber-900 dark:text-amber-100'
                        }>
                          {tPwValidation(passwordValidation.messageKey)}
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowPasswordReset(false)} disabled={isUpdating}>
                        {t('cancel')}
                      </Button>
                      <Button onClick={handlePasswordReset} disabled={isUpdating || !passwordValidation.isValid}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('confirmPasswordReset')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Activate/Deactivate */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start ${user.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}
                    disabled={isUpdating}
                  >
                    {user.isActive ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        {t('deactivateUser')}
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        {t('activateUser')}
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {user.isActive ? t('confirmDeactivateTitle') : t('confirmActivateTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {user.isActive ? t('confirmDeactivateDescription') : t('confirmActivateDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleActive}>
                      {user.isActive ? t('deactivate') : t('activate')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete - Super Admin Only */}
              <SuperAdminOnly>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      disabled={isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('deleteUser')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('confirmDeleteDescription', { name: `${user.firstName} ${user.lastName}` })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('confirmDelete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SuperAdminOnly>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminOnly>
  );
}
