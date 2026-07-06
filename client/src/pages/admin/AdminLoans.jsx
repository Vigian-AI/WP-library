import { useEffect, useState, useCallback } from 'react';
import { loanAPI } from '../../services/api';
import Icon from '../../components/Icon';

const statusConfig = {
    pending:  { label: 'Menunggu',    class: 'bg-yellow-100 text-yellow-700',  icon: 'pending' },
    active:   { label: 'Aktif',       class: 'bg-secondary/10 text-secondary', icon: 'bookmark_added' },
    returned: { label: 'Dikembalikan',class: 'bg-primary/10 text-primary',     icon: 'assignment_return' },
    overdue:  { label: 'Terlambat',   class: 'bg-error/10 text-error',         icon: 'warning' },
    rejected: { label: 'Ditolak',     class: 'bg-surface-container text-on-surface-variant', icon: 'cancel' },
};

const Toast = ({ toast }) => {
    if (!toast) return null;
    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-primary text-on-primary' :
            toast.type === 'error'   ? 'bg-error text-white' :
                                       'bg-surface-container border border-outline-variant/30 text-on-surface'
        }`}>
            <Icon name={toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'} size={18} />
            {toast.message}
        </div>
    );
};

const RejectDialog = ({ open, onConfirm, onCancel }) => {
    const [reason, setReason] = useState('');
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border border-outline-variant/30">
                <h3 className="text-title-lg font-bold text-on-surface mb-2">Tolak Peminjaman</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">Berikan alasan penolakan (opsional):</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Contoh: Stok sedang dalam perawatan..."
                    rows={3}
                    className="w-full bg-surface-container rounded-lg px-3 py-2 text-body-sm border border-outline-variant/30 focus:outline-none focus:border-primary resize-none mb-4"
                />
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant text-body-sm font-semibold hover:bg-surface-container transition-all">
                        Batal
                    </button>
                    <button
                        onClick={() => { onConfirm(reason); setReason(''); }}
                        className="px-4 py-2 rounded-lg bg-error text-white text-body-sm font-bold hover:brightness-110 active:scale-95 transition-all"
                    >
                        Tolak Peminjaman
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminLoans = () => {
    const [loans, setLoans]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectDialog, setRejectDialog]   = useState(null);
    const [toast, setToast]         = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'pending')  res = await loanAPI.getPending();
            else if (activeTab === 'active')  res = await loanAPI.getAllActive();
            else if (activeTab === 'overdue') res = await loanAPI.getOverdue();
            setLoans(res.data || []);
        } catch {
            showToast('Gagal memuat data peminjaman', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);

    const handleApprove = async (loanId) => {
        setActionLoading(loanId + '-approve');
        try {
            await loanAPI.approve(loanId);
            showToast('Peminjaman berhasil disetujui!', 'success');
            fetchLoans();
        } catch (err) {
            showToast(err.response?.data?.error || 'Gagal menyetujui', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (reason) => {
        const loanId = rejectDialog;
        setRejectDialog(null);
        setActionLoading(loanId + '-reject');
        try {
            await loanAPI.reject(loanId, reason);
            showToast('Peminjaman berhasil ditolak', 'info');
            fetchLoans();
        } catch (err) {
            showToast(err.response?.data?.error || 'Gagal menolak', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePayFine = async (loanId) => {
        setActionLoading(loanId + '-fine');
        try {
            await loanAPI.payFine(loanId);
            showToast('Denda berhasil dilunasi!', 'success');
            fetchLoans();
        } catch (err) {
            showToast(err.response?.data?.error || 'Gagal melunasi denda', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    const filteredLoans = loans.filter(l => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return l.title?.toLowerCase().includes(q) ||
               l.full_name?.toLowerCase().includes(q) ||
               l.username?.toLowerCase().includes(q);
    });

    const tabs = [
        { key: 'pending', label: 'Menunggu Persetujuan', icon: 'pending' },
        { key: 'active',  label: 'Peminjaman Aktif',     icon: 'bookmark_added' },
        { key: 'overdue', label: 'Terlambat',             icon: 'warning' },
    ];

    return (
        <>
            <Toast toast={toast} />
            <RejectDialog
                open={!!rejectDialog}
                onConfirm={handleReject}
                onCancel={() => setRejectDialog(null)}
            />

            <div className="min-h-screen flex flex-col bg-background">
                <main className="flex-1 p-space-lg space-y-space-lg max-w-7xl mx-auto w-full">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <h2 className="text-headline-lg text-on-surface">Manajemen Peminjaman</h2>
                            <p className="text-body-sm text-on-surface-variant">Setujui, tolak, dan pantau semua peminjaman buku</p>
                        </div>
                        <button
                            onClick={fetchLoans}
                            className="p-2.5 bg-surface-container border border-outline-variant/30 rounded-lg hover:bg-surface-container-high transition-colors self-start"
                            title="Refresh"
                        >
                            <Icon name="refresh" size={20} className="text-on-surface-variant" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-body-sm font-semibold whitespace-nowrap transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-primary text-on-primary shadow-sm'
                                        : 'bg-surface border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'
                                }`}
                            >
                                <Icon name={tab.icon} size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan judul, nama, atau username..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Konten */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Icon name="sync" size={40} className="text-primary animate-spin" />
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface border border-outline-variant/20 rounded-2xl text-center">
                            <Icon name={activeTab === 'pending' ? 'pending' : activeTab === 'overdue' ? 'check_circle' : 'collections_bookmark'} size={48} className="text-on-surface-variant/40" />
                            <p className="text-body-md text-on-surface-variant">
                                {activeTab === 'pending' ? 'Tidak ada permintaan peminjaman yang menunggu' :
                                 activeTab === 'overdue' ? 'Tidak ada peminjaman terlambat' :
                                 'Tidak ada peminjaman aktif'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Header count */}
                            <p className="text-body-sm text-on-surface-variant">
                                Menampilkan <span className="font-bold text-on-surface">{filteredLoans.length}</span> peminjaman
                            </p>

                            {filteredLoans.map(loan => {
                                const cfg = statusConfig[loan.status] || statusConfig.active;
                                const isLoading = actionLoading?.startsWith(String(loan.id));
                                const fineAmount = parseFloat(loan.fine_amount || 0);
                                const overdueDays = parseInt(loan.overdue_days || 0);

                                return (
                                    <div key={loan.id} className={`bg-surface rounded-xl border overflow-hidden transition-all ${
                                        loan.status === 'pending' ? 'border-yellow-300/50 shadow-sm shadow-yellow-100' :
                                        loan.status === 'overdue' ? 'border-error/30 shadow-sm shadow-error/10' :
                                        'border-outline-variant/20'
                                    }`}>
                                        <div className="flex">
                                            {/* Cover */}
                                            <div className="w-[70px] sm:w-[80px] flex-shrink-0 bg-surface-container">
                                                <img
                                                    src={loan.cover_image_url || 'https://placehold.co/80x110?text=Book'}
                                                    alt={loan.title}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.src = 'https://placehold.co/80x110?text=Book'; }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 p-4 min-w-0">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-on-surface text-sm leading-snug line-clamp-1">{loan.title}</h3>
                                                        <p className="text-xs text-on-surface-variant mt-0.5">{loan.author}</p>
                                                    </div>
                                                    <span className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${cfg.class}`}>
                                                        <Icon name={cfg.icon} size={12} />
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                {/* Peminjam */}
                                                <div className="flex items-center gap-2 mb-3 p-2 bg-surface-container/50 rounded-lg">
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                        <Icon name="person" size={14} className="text-primary" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-on-surface">{loan.full_name}</span>
                                                        <span className="text-xs text-on-surface-variant ml-1">(@{loan.username})</span>
                                                    </div>
                                                    <span className="text-[10px] text-on-surface-variant ml-auto">#{loan.id}</span>
                                                </div>

                                                {/* Tanggal & Info */}
                                                <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
                                                    <div>
                                                        <p className="text-[11px] text-on-surface-variant">Tgl Permintaan</p>
                                                        <p className="text-xs font-semibold text-on-surface">{formatDate(loan.created_at)}</p>
                                                    </div>
                                                    {loan.loan_date && loan.status !== 'pending' && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Tgl Pinjam</p>
                                                            <p className="text-xs font-semibold text-on-surface">{formatDate(loan.loan_date)}</p>
                                                        </div>
                                                    )}
                                                    {loan.due_date && loan.status !== 'pending' && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Jatuh Tempo</p>
                                                            <p className={`text-xs font-semibold ${loan.status === 'overdue' ? 'text-error' : 'text-on-surface'}`}>
                                                                {formatDate(loan.due_date)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {overdueDays > 0 && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Terlambat</p>
                                                            <p className="text-xs font-bold text-error">{overdueDays} hari</p>
                                                        </div>
                                                    )}
                                                    {fineAmount > 0 && (
                                                        <div>
                                                            <p className="text-[11px] text-on-surface-variant">Denda</p>
                                                            <p className={`text-xs font-bold ${loan.fine_paid ? 'text-primary line-through' : 'text-error'}`}>
                                                                ${fineAmount.toFixed(2)} {loan.fine_paid ? '(Lunas)' : ''}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {loan.notes && loan.status === 'rejected' && (
                                                        <div className="w-full">
                                                            <p className="text-[11px] text-on-surface-variant">Alasan Penolakan</p>
                                                            <p className="text-xs text-error">{loan.notes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tombol Aksi */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {loan.status === 'pending' && (
                                                        <>
                                                            <button
                                                                disabled={isLoading}
                                                                onClick={() => handleApprove(loan.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                                                            >
                                                                {actionLoading === loan.id + '-approve'
                                                                    ? <Icon name="sync" size={14} className="animate-spin" />
                                                                    : <Icon name="check_circle" size={14} />
                                                                }
                                                                Setujui
                                                            </button>
                                                            <button
                                                                disabled={isLoading}
                                                                onClick={() => setRejectDialog(loan.id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-error/40 text-error text-xs font-bold hover:bg-error/10 active:scale-95 transition-all disabled:opacity-60"
                                                            >
                                                                {actionLoading === loan.id + '-reject'
                                                                    ? <Icon name="sync" size={14} className="animate-spin" />
                                                                    : <Icon name="cancel" size={14} />
                                                                }
                                                                Tolak
                                                            </button>
                                                        </>
                                                    )}
                                                    {fineAmount > 0 && !loan.fine_paid && loan.status === 'returned' && (
                                                        <button
                                                            disabled={isLoading}
                                                            onClick={() => handlePayFine(loan.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                                                        >
                                                            {actionLoading === loan.id + '-fine'
                                                                ? <Icon name="sync" size={14} className="animate-spin" />
                                                                : <Icon name="payments" size={14} />
                                                            }
                                                            Lunas Denda ${fineAmount.toFixed(2)}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default AdminLoans;
