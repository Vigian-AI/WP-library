-- Migration: Peningkatan fitur peminjaman
-- Jalankan di phpMyAdmin: Database wp_library > SQL > paste dan Execute

-- 1. Tambah kolom extension_count dan fine_paid ke tabel loans
ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS extension_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS fine_paid TINYINT(1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 2. Tambah setting baru
INSERT IGNORE INTO system_settings (`key`, value, description) VALUES
    ('max_extensions', '2', 'Maximum number of loan extensions allowed'),
    ('reminder_days_before', '3', 'Days before due date to send reminder notification');
