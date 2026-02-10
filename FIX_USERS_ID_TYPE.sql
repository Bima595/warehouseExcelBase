-- Script untuk mengubah tipe kolom id dari UUID ke TEXT
-- IMPORTANT: Hapus foreign key constraint terlebih dahulu!

-- ============================================
-- LANGKAH 1: Hapus foreign key constraint ke auth.users
-- ============================================
-- Hapus constraint foreign key jika ada
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Hapus constraint lain yang mungkin ada
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_id_fkey1;

-- Hapus semua foreign key constraint yang reference ke auth.users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
        AND constraint_type = 'FOREIGN KEY'
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
ALTER TABLE users 
ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- ============================================
-- LANGKAH 4: Set kembali PRIMARY KEY
-- ============================================
ALTER TABLE users 
ADD PRIMARY KEY (id);

-- Catatan:
-- 1. Foreign key ke auth.users sudah dihapus karena kita tidak menggunakannya
-- 2. Kolom id sekarang bertipe TEXT (bisa menerima CUID)
-- 3. CUID format: fz9hdoiapxpu7cr5jasussa4 (bukan UUID format)
