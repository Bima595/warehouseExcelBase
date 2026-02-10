'use client';

import { useState, useEffect } from 'react';
import { Users, Edit3, Trash2, Shield, Mail, User as UserIcon, Loader2, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  getUsersAction,
  softDeleteUserAction,
  updateUserRoleAction,
  updateUserAction,
} from '@/app/actions/user';
import type { UserWithoutPassword } from '@/lib/excel-db';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserWithoutPassword | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsersAction();
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Gagal memuat data user' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Internal Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserWithoutPassword) => {
    setEditingUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role || 'unemployees' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const result = await updateUserAction(editingUser.id, editForm);
      if (result.success) {
        toast({ title: 'Success', description: 'User updated' });
        setEditingUser(null);
        loadUsers();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Save failed' });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const result = await softDeleteUserAction(deleteUser.id);
      if (result.success) {
        toast({ title: 'Success', description: 'User deleted' });
        setDeleteUser(null);
        loadUsers();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Delete failed' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.success) {
        toast({ title: 'Role Updated', description: `User role changed to ${newRole}` });
        loadUsers();
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Role update failed' });
    }
  };

  const roleConfigs: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    employee: { label: 'Staff', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    unemployees: { label: 'Guest', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat Data User...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">User <span className="text-primary">Management</span></h2>
          <p className="text-slate-500 font-medium">Kelola pengguna dan hak akses mereka</p>
        </div>
        <div className="h-14 w-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
          <Users className="h-6 w-6 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {users.map((user, index) => {
            const config = roleConfigs[user.role || 'unemployees'] || roleConfigs.unemployees;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group border-none bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="relative h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                        <UserIcon className="h-7 w-7 text-slate-400" />
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-primary flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{user.username}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-10 px-4 rounded-xl font-semibold gap-2">
                            Change Role
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-xl p-2">
                          {Object.entries(roleConfigs).map(([key, cfg]) => (
                            <DropdownMenuItem 
                              key={key} 
                              onClick={() => handleRoleChange(user.id, key)}
                              className="rounded-lg p-3 font-semibold flex items-center justify-between gap-8 cursor-pointer"
                            >
                              <span className={cfg.color}>{cfg.label}</span>
                              {user.role === key && <Check className="h-4 w-4 text-primary" />}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(user)} className="h-10 w-10 rounded-xl">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setDeleteUser(user)} className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="border-none shadow-2xl rounded-3xl p-8 bg-white dark:bg-slate-950 max-w-lg">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold">Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Username</Label>
              <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-12 rounded-xl" />
            </div>
          </div>
          <DialogFooter className="mt-8 flex flex-row gap-3">
            <Button variant="outline" onClick={() => setEditingUser(null)} className="h-12 flex-1 rounded-xl font-semibold">Cancel</Button>
            <Button onClick={handleSaveEdit} className="h-12 flex-1 rounded-xl font-semibold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-500 pt-2">
              Are you sure you want to remove <strong>{deleteUser?.username}</strong>? This action will disable their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 rounded-xl bg-red-500 hover:bg-red-600 font-semibold">Delete User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
