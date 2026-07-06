const loanModel = require('../models/loan.model');
const bookModel = require('../models/book.model');
const systemSettings = require('../models/systemSettings.model');
const systemLogModel = require('../models/systemLog.model');
const notificationModel = require('../models/notification.model');

class LoanController {
    async getLoansByUser(req, res) {
        try {
            const loans = await loanModel.findByUser(req.params.userId);
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getActiveLoansByUser(req, res) {
        try {
            const loans = await loanModel.findActiveByUser(req.params.userId);
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getOverdueLoans(req, res) {
        try {
            const loans = await loanModel.findOverdue();
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAllActiveLoans(req, res) {
        try {
            const loans = await loanModel.getActiveLoans();
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPendingLoans(req, res) {
        try {
            const loans = await loanModel.findPending();
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async borrowBook(req, res) {
        try {
            const userId = req.user?.id;
            const bookId = req.params.bookId;

            // Cek buku ada dan stok tersedia
            const book = await bookModel.findById(bookId);
            if (!book) return res.status(404).json({ error: 'Buku tidak ditemukan' });
            if (book.stock <= 0) return res.status(400).json({ error: 'Stok buku habis' });

            // Cek apakah sudah meminjam/request buku yang sama
            const existingLoan = await loanModel.findActiveBookByUser(userId, bookId);
            if (existingLoan) {
                const msg = existingLoan.status === 'pending'
                    ? 'Anda sudah mengajukan permintaan untuk buku ini, menunggu persetujuan admin'
                    : 'Anda sudah meminjam buku ini dan belum mengembalikannya';
                return res.status(400).json({ error: msg });
            }

            // Cek batas maksimal peminjaman per user
            const maxBooks = parseInt(await systemSettings.get('max_books_per_user')) || 5;
            const activeCount = await loanModel.countActiveByUser(userId);
            if (activeCount >= maxBooks) {
                return res.status(400).json({
                    error: `Anda telah mencapai batas maksimal peminjaman (${maxBooks} buku). Kembalikan buku terlebih dahulu.`
                });
            }

            // Hitung due_date estimasi (akan di-update saat approve)
            const loanPeriodDays = parseInt(await systemSettings.get('loan_period_days')) || 14;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + loanPeriodDays);

            // Buat peminjaman dengan status PENDING
            const loan = await loanModel.create({
                user_id: userId,
                book_id: bookId,
                due_date: dueDate,
                extension_count: 0,
                fine_amount: 0,
                fine_paid: 0,
            });

            await systemLogModel.create(userId, 'BORROW_REQUEST', { book_id: bookId, loan_id: loan.id }, req.ip);

            // Notifikasi ke user: permintaan terkirim
            await notificationModel.createForUser(
                userId,
                'Permintaan Peminjaman Dikirim',
                `Permintaan meminjam "${book.title}" sedang menunggu persetujuan admin. Anda akan mendapat notifikasi setelah diproses.`,
                'info'
            );

            res.status(201).json({ ...loan, book_title: book.title, status: 'pending' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async approveLoan(req, res) {
        try {
            const loanId = req.params.loanId;
            const loanPeriodDays = parseInt(await systemSettings.get('loan_period_days')) || 14;

            const loanBefore = await loanModel.findById(loanId);
            if (!loanBefore) return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
            if (loanBefore.status !== 'pending') return res.status(400).json({ error: 'Peminjaman bukan dalam status pending' });

            const loan = await loanModel.approveLoan(loanId, loanPeriodDays);
            await systemLogModel.create(req.user?.id, 'APPROVE_LOAN', { loan_id: loanId }, req.ip);

            // Ambil info buku untuk notifikasi
            const book = await bookModel.findById(loanBefore.book_id);
            const dueDate = new Date(loan.due_date);

            await notificationModel.createForUser(
                loanBefore.user_id,
                'Peminjaman Disetujui!',
                `Permintaan meminjam "${book?.title || 'buku'}" telah disetujui. Jatuh tempo: ${dueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
                'success'
            );

            res.json({ message: 'Peminjaman berhasil disetujui', loan });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async rejectLoan(req, res) {
        try {
            const loanId = req.params.loanId;
            const reason = req.body?.reason || 'Tidak ada alasan yang diberikan';

            const loanBefore = await loanModel.findById(loanId);
            if (!loanBefore) return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
            if (loanBefore.status !== 'pending') return res.status(400).json({ error: 'Peminjaman bukan dalam status pending' });

            const loan = await loanModel.rejectLoan(loanId, reason);
            await systemLogModel.create(req.user?.id, 'REJECT_LOAN', { loan_id: loanId, reason }, req.ip);

            const book = await bookModel.findById(loanBefore.book_id);

            await notificationModel.createForUser(
                loanBefore.user_id,
                'Peminjaman Ditolak',
                `Permintaan meminjam "${book?.title || 'buku'}" ditolak. Alasan: ${reason}.`,
                'warning'
            );

            res.json({ message: 'Peminjaman berhasil ditolak', loan });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async returnBook(req, res) {
        try {
            const loanId = req.params.loanId;
            const finePerDay = parseFloat(await systemSettings.get('fine_per_day')) || 0.5;

            const loanBefore = await loanModel.findById(loanId);
            if (!loanBefore) return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });
            if (loanBefore.status !== 'active') return res.status(400).json({ error: 'Peminjaman tidak dalam status aktif' });

            const returned = await loanModel.returnBook(loanId, finePerDay);
            await systemLogModel.create(req.user?.id, 'RETURN_BOOK', { loan_id: loanId }, req.ip);

            const fineMsg = returned.fine_amount > 0
                ? ` Denda keterlambatan: $${parseFloat(returned.fine_amount).toFixed(2)}.`
                : '';
            await notificationModel.createForUser(
                loanBefore.user_id,
                'Buku Berhasil Dikembalikan',
                `Buku telah berhasil dikembalikan.${fineMsg}`,
                returned.fine_amount > 0 ? 'warning' : 'success'
            );

            res.json({ message: 'Buku berhasil dikembalikan', fine_amount: returned.fine_amount || 0 });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async extendLoan(req, res) {
        try {
            const days = parseInt(req.body.days) || 7;
            const loanId = req.params.loanId;
            const maxExtensions = parseInt(await systemSettings.get('max_extensions')) || 2;

            const loan = await loanModel.extendLoan(loanId, days, maxExtensions);
            if (!loan) return res.status(404).json({ error: 'Peminjaman tidak ditemukan atau tidak dapat diperpanjang' });

            await systemLogModel.create(req.user?.id, 'EXTEND_LOAN', { loan_id: loanId, days }, req.ip);

            const newDueDate = new Date(loan.due_date);
            await notificationModel.createForUser(
                loan.user_id,
                'Peminjaman Diperpanjang',
                `Peminjaman diperpanjang ${days} hari. Jatuh tempo baru: ${newDueDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}. Sisa perpanjangan: ${maxExtensions - loan.extension_count} kali.`,
                'info'
            );

            res.json({ ...loan, extensions_remaining: maxExtensions - loan.extension_count });
        } catch (error) {
            if (error.message.includes('tidak dapat diperpanjang')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async payFine(req, res) {
        try {
            const loan = await loanModel.payFine(req.params.loanId);
            if (!loan) return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });

            await systemLogModel.create(req.user?.id, 'PAY_FINE', { loan_id: req.params.loanId, amount: loan.fine_amount }, req.ip);

            await notificationModel.createForUser(
                loan.user_id,
                'Denda Lunas',
                `Denda sebesar $${parseFloat(loan.fine_amount).toFixed(2)} telah ditandai sebagai lunas.`,
                'success'
            );

            res.json({ message: 'Denda berhasil dilunasi', loan });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async sendReminders(req, res) {
        try {
            const daysBeforeDue = parseInt(await systemSettings.get('reminder_days_before')) || 3;
            const loans = await loanModel.getLoansNeedingReminder(daysBeforeDue);

            let sent = 0;
            for (const loan of loans) {
                await notificationModel.createForUser(
                    loan.user_id,
                    'Pengingat Jatuh Tempo',
                    `Buku "${loan.title}" akan jatuh tempo dalam ${daysBeforeDue} hari (${new Date(loan.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}). Segera kembalikan atau perpanjang peminjaman.`,
                    'due_reminder'
                );
                sent++;
            }

            res.json({ message: `${sent} reminder terkirim` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async exportLoans(req, res) {
        try {
            const { status, from, to } = req.query;
            const loans = await loanModel.exportLoans({ status, from, to });

            const headers = ['ID', 'Nama Peminjam', 'Username', 'Judul Buku', 'Penulis', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status', 'Perpanjangan', 'Denda', 'Denda Lunas'];
            const rows = loans.map(l => [
                l.id,
                `"${l.full_name}"`,
                l.username,
                `"${l.title}"`,
                `"${l.author}"`,
                l.loan_date   ? new Date(l.loan_date).toLocaleDateString('id-ID')   : '',
                l.due_date    ? new Date(l.due_date).toLocaleDateString('id-ID')    : '',
                l.return_date ? new Date(l.return_date).toLocaleDateString('id-ID') : '',
                l.status,
                l.extension_count || 0,
                `$${parseFloat(l.fine_amount || 0).toFixed(2)}`,
                l.fine_paid ? 'Ya' : 'Tidak',
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_peminjaman.csv"');
            res.send('\uFEFF' + csv);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await loanModel.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new LoanController();
