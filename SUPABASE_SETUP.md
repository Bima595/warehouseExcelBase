# Panduan Setup Supabase

## 1. Setup Environment Variables

### Langkah 1: Buat file `.env.local`
Buat file `.env.local` di root project dengan isi:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_api_key_here
```

**Catatan:** 
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL yang Anda dapatkan
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Publishable API Key yang Anda dapatkan (ini sama dengan Anon Key)

### Langkah 2: Dapatkan API Keys dari Supabase Dashboard
1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** > **API**
4. Copy **Project URL** → masukkan ke `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon/public key** → masukkan ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Setup Database Tables

Buka **SQL Editor** di Supabase Dashboard dan jalankan query berikut:

### Tabel 1: `users`
```sql
-- Buat tabel users
-- Catatan: id menggunakan TEXT (bukan UUID) untuk kompatibilitas dengan CUID
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Password hash (bcrypt)
  role TEXT DEFAULT 'unemployees',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### Tabel 2: `stocks`
```sql
-- Buat tabel stocks
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_barang TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  harga_beli NUMERIC(12, 2) NOT NULL,
  harga_jual NUMERIC(12, 2) NOT NULL,
  gambar TEXT,
  qr_code TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_stocks_deleted_at ON stocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_stocks_created_at ON stocks(created_at DESC);
```

### Tabel 3: `transactions`
```sql
-- Buat tabel transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  items JSONB NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  metode_pembayaran TEXT NOT NULL CHECK (metode_pembayaran IN ('cash', 'transfer', 'qris', 'debit', 'kredit')),
  kasir TEXT,
  invoice_path TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_transactions_cancelled_at ON transactions(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
```

---

## 3. Setup Row Level Security (RLS)

### Enable RLS untuk semua tabel:

```sql
-- Enable RLS untuk users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS untuk stocks
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Enable RLS untuk transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

### Buat Policies untuk `users`:

```sql
-- Policy: Semua user terauthentikasi bisa membaca semua users
CREATE POLICY "Users are viewable by authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Policy: User bisa insert data sendiri (untuk registrasi)
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Admin bisa update semua users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Buat Policies untuk `stocks`:

```sql
-- Policy: Semua user terauthentikasi bisa membaca stocks yang tidak dihapus
CREATE POLICY "Stocks are viewable by authenticated users"
  ON stocks FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Policy: Admin bisa membaca semua stocks (termasuk yang dihapus)
CREATE POLICY "Admins can view all stocks"
  ON stocks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admin bisa insert, update, dan delete stocks
CREATE POLICY "Admins can manage stocks"
  ON stocks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Buat Policies untuk `transactions`:

```sql
-- Policy: Semua user terauthentikasi bisa membaca transactions yang tidak dibatalkan
CREATE POLICY "Transactions are viewable by authenticated users"
  ON transactions FOR SELECT
  TO authenticated
  USING (cancelled_at IS NULL);

-- Policy: Admin bisa membaca semua transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Semua user terauthentikasi bisa membuat transaction
CREATE POLICY "Authenticated users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Admin bisa update transactions
CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 4. Setup Authentication di Supabase

### Langkah 1: Enable Email Authentication
1. Buka **Authentication** > **Providers** di Supabase Dashboard
2. Pastikan **Email** provider sudah diaktifkan
3. (Opsional) Konfigurasi email templates jika diperlukan

### Langkah 2: Buat User Admin Pertama
Setelah setup selesai, buat user admin pertama melalui:
1. **Authentication** > **Users** > **Add User**
2. Atau gunakan API register di aplikasi
3. Setelah user dibuat, update role menjadi 'admin' di tabel `users`:

```sql
-- Update user menjadi admin (ganti email dengan email admin Anda)
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

---

## 5. Setup Trigger untuk Auto-Update `updated_at`

```sql
-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk stocks
CREATE TRIGGER update_stocks_updated_at 
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Setup Trigger untuk Auto-Create User Record

Ketika user register melalui Supabase Auth, otomatis buat record di tabel `users`:

```sql
-- Function untuk auto-create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'unemployees')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk auto-create user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 7. Verifikasi Setup

### Test Koneksi:
1. Pastikan file `.env.local` sudah dibuat dengan benar
2. Restart development server: `npm run dev`
3. Cek console untuk error koneksi Supabase

### Test Database:
1. Buka **Table Editor** di Supabase Dashboard
2. Pastikan tabel `users`, `stocks`, dan `transactions` sudah ada
3. Coba insert data test (opsional)

---

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env.local` ada di root project
- Pastikan nama variable benar: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart development server setelah menambah environment variables

### Error: "relation does not exist"
- Pastikan semua tabel sudah dibuat di Supabase
- Cek di **Table Editor** apakah tabel sudah ada

### Error: "permission denied"
- Pastikan RLS policies sudah dibuat
- Pastikan user sudah terauthentikasi
- Cek role user apakah sudah 'admin' jika diperlukan

### Error saat register/login
- Pastikan Email provider sudah diaktifkan di Authentication > Providers
- Cek email confirmation settings jika diperlukan

---

## Catatan Penting

1. **Jangan commit file `.env.local`** ke Git (sudah ada di `.gitignore`)
2. **Publishable API Key (Anon Key)** aman untuk digunakan di client-side
3. **Service Role Key** jangan pernah digunakan di client-side (hanya untuk server-side operations)
4. Pastikan **RLS policies** sesuai dengan kebutuhan aplikasi Anda

