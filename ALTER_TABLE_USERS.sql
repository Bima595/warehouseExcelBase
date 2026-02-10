-- Script untuk menambahkan kolom password ke tabel users
-- Jalankan di Supabase SQL Editor

-- Tambah kolom password jika belum ada
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Update constraint untuk memastikan email tetap unique
-- (jika belum ada)
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Buat index untuk performa
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password) WHERE password IS NOT NULL;

-- Catatan: 
-- 1. Kolom password akan menyimpan password yang sudah di-hash menggunakan bcrypt
-- 2. Jangan pernah menyimpan password plain text
-- 3. Password akan di-hash di aplikasi sebelum disimpan

