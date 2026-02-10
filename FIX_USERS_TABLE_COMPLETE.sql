-- Script lengkap untuk memperbaiki tabel users
-- Jalankan di Supabase SQL Editor
-- IMPORTANT: Script ini akan menghapus foreign key ke auth.users karena kita tidak menggunakannya lagi

-- ============================================
-- LANGKAH 1: Hapus foreign key constraint ke auth.users
-- ============================================
-- Hapus constraint foreign key jika ada
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Hapus constraint lain yang mungkin reference ke auth.users
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_id_fkey1;

-- Cek dan hapus semua constraint yang reference ke auth.users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%id%'
    ) LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- ============================================
-- LANGKAH 2: Hapus PRIMARY KEY constraint sementara
-- ============================================
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_pkey;

-- ============================================
-- LANGKAH 3: Ubah tipe kolom id dari UUID ke TEXT
-- ============================================
-- Ubah tipe kolom id dari UUID ke TEXT
-- USING id::TEXT akan convert UUID yang ada menjadi TEXT
ALTER TABLE users 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- ============================================
-- LANGKAH 4: Set kembali PRIMARY KEY
-- ============================================
ALTER TABLE users 
ADD PRIMARY KEY (id);

-- ============================================
-- LANGKAH 5: Tambah kolom password jika belum ada
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- ============================================
-- LANGKAH 6: Pastikan constraint dan index
-- ============================================
-- Pastikan email unique
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_email_unique;

ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek struktur tabel
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Cek constraint yang tersisa
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- Catatan:
-- 1. Foreign key ke auth.users sudah dihapus (karena kita tidak menggunakannya)
-- 2. Kolom id sekarang bertipe TEXT (bisa menerima CUID)
-- 3. Kolom password sudah ditambahkan untuk menyimpan password hash
-- 4. Email tetap unique untuk mencegah duplikasi
-- 5. Tabel users sekarang independen dari auth.users
