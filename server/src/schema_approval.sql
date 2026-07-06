-- Migration: Tambah sistem approval peminjaman
-- Jalankan di phpMyAdmin: Database wp_library > SQL > paste dan Execute

SET SESSION sql_mode = '';

-- Tambah status 'pending' ke kolom status loans
ALTER TABLE loans MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending';

-- Update constraint check untuk include 'pending' dan 'rejected'
ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loan_status;
ALTER TABLE loans ADD CONSTRAINT chk_loan_status 
    CHECK (status IN ('pending', 'active', 'returned', 'overdue', 'rejected'));
