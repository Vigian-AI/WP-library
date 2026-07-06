import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { loanAPI } from '../services/api';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

// ── Komponen Dialog Konfirmasi ──────────────────────────────────────────────
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = 'Ya', confirmClass = 'bg-primary text-on-primary' }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border border-outline-variant/30">
                <h3 className="text-title-lg font-bold text-on-surface mb-2">{title}</h3>
                <p className="text-body-sm text-on-surface-variant mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant text-body-sm font-semibold hover:bg-surface-container transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-body-sm font-bold transition-all hover:brightness-110 active:scale-95 ${confirmClass}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Progress Bar Jatuh Tempo ────────────────────────────────────────────────
const DueDateProgress = ({ loanDate, dueDate, status }) => {
    if (status === 'returned') return null;

    const start = new Date(loanDate).getTime();
    const end   = new Date(dueDate).getTime();
    const now   = Date.now();
    const total = end - start;
    const elapsed = now - start;
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;

    let barColor, label;
    if (isOverdue) {
        barColor = 'bg-error';
        label    = `Terlambat ${Math.abs(daysRemaining)} hari`;
    } else if (daysRemaining <= 3) {
        barColor = 'bg-warning';
        label    = `Sisa ${daysRemaining} hari`;
    } else {
        barColor = 'bg-primary';
        label    = `Sisa ${daysRemaining} hari`;
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className={`text-[11px] font-semibold ${isOverdue ? 'text-error' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-on-surface-variant'}`}>
                    {label}
                </span>
                <span className="text-[10px] text-on-surface-variant">{Math.round(pct)}%</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
};

// ── Toast Notifikasi ────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-full duration-300 ${
                t.type === 'success' ? 'bg-primary text-on-primary' :
                t.type === 'error'   ? 'bg-error text-white' :
                                       'bg-surface-container border border-outline-variant/30 text-on-surface'
            }`}>
                <Icon name={t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'} size={18} />
                {t.message}
            </div>
        ))}
    </div>
);

// ── Halaman Utama Loans ─────────────────────────────────────────────────────
const Loans = () => {
    const { user } = useAuth();
    const location = useLocation();

    const [loans, setLoans]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState('active');
    const [sortBy, setSortBy]         = useState('due_date');
    const [filterStatus, setFilterStatus] = useState('all');
    const [toasts, setToasts]         = useState([]);
    const [dialog, setDialog]         = useState(null); // { type, loanId, title, message }
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        setActiveTab(location.pathname === '/history' ? 'history' : 'active');
    }, [location.pathname]);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const fetchLoans = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const response = await loanAPI.getByUser(user.id);
            setLoans(response.data || []);
        } catch {
            showToast('Gagal memuat data peminjaman', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);

    const handleReturn = async () => {
        const { loanId } = dialog;
        setDialog(null);
        setActionLoading(loanId + '-return');
        try {
            const res = await loanAPI.return(loanId);
            const fine = res.data?.fine_amount;
            if (fine > 0) {
                showToast(`Buku dikembalikan. Denda: $${parseFloat(fine).toFixed(2)}`, 'info');
            } else {
                showToast('Buku berhasil dikembalikan!', 'success');
            }
            fetchLoans();
        } catch (err) {
            showToast(err.response?.data?.error || 'Gagal mengembalikan buku', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExtend = async () => {
        const { loanId } = dialog;
        setDialog(null);
        setActionLoading(loanId + '-extend');
        try {
            const res = await loanAPI.extend(loanId, 7);
            const remaining = res.data?.extensions_remaining ?? '';
            showToast(`Diperpanjang 7 hari! Sisa perpanjangan: ${remaining}x`, 'success');
            fetchLoans();
        } catch (err) {
            showToast(err.response?.data?.error || 'Gagal memperpanjang peminjaman', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    const isOverdue = (dueDate) => new Date(dueDate) < new Date();

    // Filter & Sort
    const filteredLoans = loans
        .filter(loan => {
            const isActive = loan.status === 'active' || loan.status === 'overdue';
            if (activeTab === 'active' && !isActive) return false;
            if (activeTab === 'history' && isActive) return false;
            if (filterStatus !== 'all' && loan.status !== filterStatus) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'due_date')  return new Date(a.due_date)  - new Date(b.due_date);
            if (sortBy === 'title')     return a.title.localeCompare(b.title);
            if (sortBy === 'loan_date') return new Date(b.loan_date) - new Date(a.loan_date);
            return 0;
        });

    // Statistik ringkas
    const activeLoans  = loans.filter(l => l.status === 'active');
    const overdueLoans = loans.filter(l => l.status === 'active' && isOverdue(l.due_date));
    const totalFines   = loans.reduce((sum, l) => sum + parseFloat(l.fine_amount || 0), 0);

    return (
        <>
            <Toast toasts={toasts} />

            <ConfirmDialog
                open={dialog?.type === 'return'}
                title="Kembalikan Buku"
                message={`Yakin ingin mengembalikan "${dialog?.bookTitle}"? Jika terlambat, denda akan dihitung otomatis.`}
                confirmLabel="Ya, Kembalikan"
                confirmClass="bg-error text-white"
                onConfirm={handleReturn}
                onCancel={() => setDialog(null)}
            />
            <ConfirmDialog
                open={dialog?.type === 'extend'}
                title="Perpanjang Peminjaman"
                message={`Perpanjang peminjaman "${dialog?.bookTitle}" selama 7 hari? (Perpanjangan ke-${dialog?.extCount + 1})`}
                confirmLabel="Ya, Perpanjang"
                confirmClass="bg-primary text-on-primary"
                onConfirm={handleExtend}
                onCancel={() => setDialog(null)}
            />

            <div className="min-h-screen flex flex-col bg-background">
                <main className="flex-1 p-lg">
                    <div className="max-w-4xl mx-auto space-y-lg">

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-md">
                            <div>
                                <h2 className="text-headline-lg text-on-surface">
                                    {activeTab === 'active' ? 'Buku yang Saya Pinjam' : 'Riwayat Membaca Saya'}
                                </h2>
                                <p className="text-body-sm text-on-surface-variant mt-1">
                                    {activeTab === 'active'
                                        ? 'Kelola peminjaman aktif dan pantau tanggal jatuh tempo'
                                        : 'Tinjau semua buku yang telah Anda baca'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 border border-outline-variant/20 self-start flex-shrink-0">
                                {['active', 'history'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-md text-label-md font-semibold transition-all ${
                                            activeTab === tab
                                                ? 'bg-primary text-on-primary'
                                                : 'text-on-surface-variant hover:bg-surface-container-highest'
                                        }`}
                                    >
                                        {tab === 'active' ? 'Aktif' : 'Riwayat'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Statistik Ringkas (hanya tab aktif) */}
                        {activeTab === 'active' && !loading && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 text-center">
                                    <p className="text-headline-md font-bold text-primary">{activeLoans.length}</p>
                                    <p className="text-[11px] text-on-surface-variant mt-0.5">Dipinjam</p>
                                </div>
                                <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 text-center">
                                    <p className={`text-headline-md font-bold ${overdueLoans.length > 0 ? 'text-error' : 'text-secondary'}`}>
                                        {overdueLoans.length}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant mt-0.5">Terlambat</p>
                                </div>
                                <div className="bg-surface border border-outline-variant/20 rounded-xl p-3 text-center">
                                    <p className={`text-headline-md font-bold ${totalFines > 0 ? 'text-error' : 'text-on-surface'}`}>
                                        ${totalFines.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant mt-0.5">Total Denda</p>
                                </div>
                            </div>
                        )}

                        {/* Filter & Sort Bar */}
                        {!loading && loans.length > 0 && (
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="flex items-center gap-2">
                                    <Icon name="sort" size={16} className="text-on-surface-variant" />
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="text-body-sm bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        <option value="due_date">Urutkan: Jatuh Tempo</option>
                                        <option value="loan_date">Urutkan: Terbaru</option>
                                        <option value="title">Urutkan: Judul A-Z</option>
                                    </select>
                                </div>
                                {activeTab === 'history' && (
                                    <select
                                        value={filterStatus}
                                        onChange={e => setFilterStatus(e.target.value)}
                                        className="text-body-sm bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-primary"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="returned">Dikembalikan</option>
                                    </select>
                                )}
                                <span className="text-body-sm text-on-surface-variant ml-auto">
                                    {filteredLoans.length} peminjaman
                                </span>
                            </div>
                        )}

                        {/* Konten */}
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Icon name="sync" size={40} className="text-primary animate-spin" />
                            </div>
                        ) : filteredLoans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface border border-outline-variant/20 rounded-2xl">
                                <Icon name={activeTab === 'active' ? 'collections_bookmark' : 'history'} size={48} className="text-on-surface-variant/40" />
                                <p className="text-body-md text-on-surface-variant">
                                    {activeTab === 'active'
                                        ? 'Tidak ada peminjaman aktif. Jelajahi katalog untuk meminjam buku.'
                                        : 'Belum ada riwayat peminjaman.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredLoans.map(loan => {
                                    const overdue    = isOverdue(loan.due_date);
                                    const isReturned = loan.status === 'returned';
                                    const isLoading  = actionLoading === loan.id + '-return' || actionLoading === loan.id + '-extend';
                                    const fineAmount = parseFloat(loan.fine_amount || 0);
                                    const maxExt     = 2;
                                    const extCount   = loan.extension_count || 0;
                                    const canExtend  = !isReturned && extCount < maxExt;

                                    const statusLabel = isReturned ? 'Dikembalikan' : overdue ? 'Terlambat' : 'Aktif';
                                    const statusClass = isReturned
                                        ? 'bg-primary/10 text-primary'
                                        : overdue
                                        ? 'bg-error/10 text-error'
                                        : 'bg-secondary/10 text-secondary';

                                    return (
                                        <div
                                            key={loan.id}
                                            className={`bg-surface-container-low rounded-xl border overflow-hidden flex transition-all ${
                                                overdue && !isReturned
                                                    ? 'border-error/30 shadow-sm shadow-error/10'
                                                    : 'border-outline-variant/20'
                                            }`}
                                        >
                                            {/* Cover */}
                                            <div className="w-[80px] sm:w-[90px] flex-shrink-0">
                                                <img
                                                    src={loan.cover_image_url || `https://placehold.co/90x130?text=Book`}
                                                    alt={loan.title}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.src = `https://placehold.co/90x130?text=Book`; }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 flex flex-col px-4 py-3 min-w-0 gap-2">
                                                {/* Judul + Badge */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">{loan.title}</h3>
                                                        <p className="text-xs text-on-surface-variant mt-0.5">{loan.author}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${statusClass}`}>
                                                            {statusLabel}
                                                        </span>
                                                        {extCount > 0 && (
                                                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                                                                Diperpanjang {extCount}x
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {!isReturned && (
                                                    <DueDateProgress
                                                        loanDate={loan.loan_date}
                                                        dueDate={loan.due_date}
                                                        status={loan.status}
                                                    />
                                                )}

                                                {/* Tanggal */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                    <div>
                                                        <p className="text-[11px] text-on-surface-variant">Dipinjam</p>
                                                        <p className="text-xs font-semibold text-on-surface">{formatDate(loan.loan_date)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] text-on-surface-variant">Jatuh Tempo</p>
                                                        <p className={`text-xs font-semibold ${overdue && !isReturned ? 'text-error' : 'text-on-surface'}`}>
                                                            {formatDate(loan.due_date)}
                                                        </p>
                                                    </div>
                                                    {loan.return_date && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Dikembalikan</p>
                                                            <p className="text-xs font-semibold text-primary">{formatDate(loan.return_date)}</p>
                                                        </div>
                                                    )}
                                                    {fineAmount > 0 && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Denda</p>
                                                            <p className={`text-xs font-semibold ${loan.fine_paid ? 'text-primary line-through' : 'text-error'}`}>
                                                                ${fineAmount.toFixed(2)} {loan.fine_paid ? '(Lunas)' : ''}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tombol Aksi */}
                                                {!isReturned && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            disabled={!canExtend || isLoading}
                                                            onClick={() => setDialog({ type: 'extend', loanId: loan.id, bookTitle: loan.title, extCount })}
                                                            title={!canExtend ? `Maksimal ${maxExt}x perpanjangan` : ''}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 flex items-center gap-1 ${
                                                                canExtend && !isLoading
                                                                    ? 'border-primary/40 text-primary hover:bg-primary/10'
                                                                    : 'border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <Icon name="update" size={14} />
                                                            Perpanjang {canExtend ? `(${maxExt - extCount}x sisa)` : '(Habis)'}
                                                        </button>
                                                        <button
                                                            disabled={isLoading}
                                                            onClick={() => setDialog({ type: 'return', loanId: loan.id, bookTitle: loan.title })}
                                                            className="px-3 py-1.5 rounded-lg bg-error text-white text-xs font-semibold hover:brightness-110 transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            {isLoading ? <Icon name="sync" size={14} className="animate-spin" /> : <Icon name="assignment_return" size={14} />}
                                                            Kembalikan
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default Loans;
