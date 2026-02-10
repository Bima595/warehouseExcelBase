# Panduan Memperbaiki Masalah Password di Supabase

## Masalah
Password tidak tersimpan atau "password salah" padahal sudah terdaftar.

## Penyebab
1. **Email Confirmation diaktifkan** - User perlu konfirmasi email dulu sebelum bisa login
2. **Password tidak tersimpan** - Ada masalah saat registrasi
3. **User sudah terdaftar di sistem lama** - Perlu migrasi ke Supabase Auth

## Solusi

### 1. Cek Email Confirmation Settings

1. Buka **Supabase Dashboard** > **Authentication** > **Settings**
2. Cek bagian **Email Auth**
3. Jika **"Enable email confirmations"** aktif:
   - **Opsi A**: Nonaktifkan untuk development (tidak disarankan untuk production)
   - **Opsi B**: Biarkan aktif dan pastikan user konfirmasi email dulu

### 2. Reset Password untuk User yang Sudah Ada

Jika user sudah terdaftar tapi password tidak bekerja:

#### Via Supabase Dashboard:
1. Buka **Authentication** > **Users**
2. Cari user yang bermasalah
3. Klik **"..."** > **"Reset Password"**
4. User akan menerima email reset password

#### Via SQL (untuk admin):
```sql
-- Reset password user (ganti email dengan email user)
UPDATE auth.users 
SET encrypted_password = crypt('password_baru', gen_salt('bf'))
WHERE email = 'user@example.com';
```

### 3. Migrasi User dari Sistem Lama

Jika ada user yang sudah terdaftar di sistem Excel lama:

#### Langkah 1: Export user dari sistem lama
```sql
-- Jika ada di database lama, export data user
```

#### Langkah 2: Import ke Supabase Auth
Gunakan Supabase Admin API atau Dashboard untuk membuat user:

```javascript
// Contoh menggunakan Supabase Admin API
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key, bukan Anon Key
);

// Buat user baru dengan password
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password_user',
  email_confirm: true, // Auto-confirm email
  user_metadata: {
    username: 'username_user',
    role: 'unemployees'
  }
});
```

### 4. Cek Password di Supabase

Untuk memastikan password tersimpan:

1. Buka **Authentication** > **Users**
2. Cari user yang bermasalah
3. Cek kolom **"Last Sign In"** - jika null, berarti belum pernah login berhasil
4. Cek **"Email Confirmed"** - harus true untuk bisa login

### 5. Test Login Langsung di Supabase

1. Buka **Authentication** > **Users**
2. Klik user yang ingin ditest
3. Klik **"Send magic link"** atau **"Reset password"**
4. Coba login dengan password yang baru

## Troubleshooting

### Error: "Email not confirmed"
**Solusi**: 
- Nonaktifkan email confirmation di Settings, atau
- Pastikan user klik link konfirmasi di email

### Error: "Invalid login credentials"
**Kemungkinan**:
1. Password salah
2. Email salah (case-sensitive di beberapa kasus)
3. User belum terdaftar di auth.users

**Solusi**:
- Reset password user
- Pastikan email sudah di-normalize (lowercase)

### User ada di tabel `users` tapi tidak bisa login
**Penyebab**: User ada di tabel `users` tapi tidak ada di `auth.users`

**Solusi**:
- Buat user di Supabase Auth menggunakan Admin API
- Atau hapus dari tabel `users` dan registrasi ulang

## Best Practices

1. **Selalu gunakan Supabase Auth untuk password** - Jangan simpan password di tabel `users`
2. **Normalize email** - Selalu lowercase dan trim email
3. **Handle email confirmation** - Pastikan user flow untuk konfirmasi email
4. **Gunakan Service Role Key dengan hati-hati** - Hanya untuk server-side operations

## Script untuk Migrasi User (Opsional)

Jika perlu migrasi banyak user, buat script:

```typescript
// migrate-users.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key
);

async function migrateUser(email: string, password: string, username: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role }
  });

  if (error) {
    console.error(`Error migrating ${email}:`, error);
    return null;
  }

  // Insert ke tabel users
  const { error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: data.user.id,
      username,
      email,
      role,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error(`Error inserting ${email} to users table:`, insertError);
  }

  return data.user;
}
```

