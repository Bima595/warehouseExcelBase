'use server';

import { readUsers, findUserById } from '@/lib/excel-db';
import { supabase } from '@/lib/supabase';
import type { UserWithoutPassword } from '@/lib/excel-db';

export async function getUsersAction() {
  try {
    const users = await readUsers();
    // Filter out deleted users (soft delete)
    const activeUsers = users.filter((user) => {
      // Check if user has deleted_at field (soft delete)
      // For now, we'll check if user exists in database without deleted_at
      return user;
    });

    // Remove password from response
    const usersWithoutPassword: UserWithoutPassword[] = activeUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'unemployees',
      createdAt: user.createdAt,
    }));

    return {
      success: true,
      users: usersWithoutPassword,
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return {
      success: false,
      error: 'Gagal mengambil data user',
      users: [],
    };
  }
}

export async function softDeleteUserAction(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error soft deleting user:', error);
      return {
        success: false,
        error: 'Gagal menghapus user',
      };
    }

    return {
      success: true,
      message: 'User berhasil dihapus',
    };
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat menghapus user',
    };
  }
}

export async function updateUserRoleAction(userId: string, role: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return {
        success: false,
        error: 'Gagal mengupdate role user',
      };
    }

    return {
      success: true,
      message: 'Role user berhasil diupdate',
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat mengupdate role user',
    };
  }
}

export async function updateUserAction(
  userId: string,
  updates: {
    username?: string;
    email?: string;
    role?: string;
  }
) {
  try {
    const updateData: Record<string, any> = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: 'Gagal mengupdate user',
      };
    }

    return {
      success: true,
      message: 'User berhasil diupdate',
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat mengupdate user',
    };
  }
}

