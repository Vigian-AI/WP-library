import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { loanAPI } from '../services/api';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

const Loans = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        setActiveTab(location.pathname === '/history' ? 'history' : 'active');
    }, [location.pathname]);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const response = await loanAPI.getByUser(user?.id);
            setLoans(response.data || []);
        } catch (error) {
            console.error('Error fetching loans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLoans(); }, [user?.id]);

    const handleReturn = async (loanId) => {
        try {
            await loanAPI.return(loanId);
            alert('Buku berhasil dikembalikan!');
            fetchLoans();
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal mengembalikan buku');
        }
    };

    const handleExtend = async (loanId) => {
        try {
            await loanAPI.extend(loanId, 7);
            alert('Peminjaman diperpanjang 7 hari!');
            fetchLoans();
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal memperpanjang peminjaman');
        }
    };

    const isOverdue = (dueDate) => new Date(dueDate) < new Date();

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const filteredLoans = loans.filter((loan) => {
        const isActive = loan.status === 'active' || loan.status === 'overdue';
        return activeTab === 'active' ? isActive : !isActive;
    });

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-lg">
                <div className="max-w-4xl mx-auto space-y-lg">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md">
                        <div>
                            <h2 className="text-headline-lg text-on-surface">
                                {activeTab === 'active' ? 'Buku yang Saya Pinjam' : 'Riwayat Membaca Saya'}
                            </h2>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                                {activeTab === 'active'
                                    ? 'Kelola peminjaman aktif Anda dan pantau tanggal jatuh tempo'
                                    : 'Tinjau semua buku yang telah Anda baca sebelumnya'}
                            </p>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 border border-outline-variant/20 self-start">
                            {['active', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-label-md font-semibold transition-all ${
                                        activeTab === tab
                                            ? 'bg-primary text-on-primary'
                                            : 'text-on-surface-variant hover:bg-surface-container-highest'
                                    }`}
                                >
                                    {tab === 'active' ? 'Peminjaman Aktif' : 'Riwayat Peminjaman'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Konten */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Icon name="sync" size={40} className="text-primary animate-spin" />
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <Icon
                                name={activeTab === 'active' ? 'collections_bookmark' : 'history'}
                                size={48}
                                className="text-on-surface-variant"
                            />
                            <p className="text-body-md text-on-surface-variant">
                                {activeTab === 'active'
                                    ? 'Tidak ada peminjaman aktif. Jelajahi katalog untuk meminjam buku.'
                                    : 'Anda belum memiliki riwayat membaca.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredLoans.map((loan) => {
                                const overdue = isOverdue(loan.due_date);
                                const isReturned = loan.status === 'returned';
                                const statusLabel = isReturned ? 'Dikembalikan' : overdue ? 'Terlambat' : 'Aktif';
                                const statusClass = isReturned
                                    ? 'bg-primary/10 text-primary'
                                    : overdue
                                    ? 'bg-error/10 text-error'
                                    : 'bg-secondary/10 text-secondary';

                                return (
                                    <div
                                        key={loan.id}
                                        className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden flex"
                                    >
                                        {/* Cover */}
                                        <div className="w-[90px] flex-shrink-0">
                                            <img
                                                src={loan.cover_image_url || `https://placehold.co/90x130?text=Book`}
                                                alt={loan.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col justify-between px-4 py-3 min-w-0 gap-2">
                                            {/* Baris 1: Judul + Badge */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-on-surface leading-snug">{loan.title}</h3>
                                                    <p className="text-xs text-on-surface-variant mt-0.5">{loan.author}</p>
                                                </div>
                                                <span className={`flex-shrink-0 text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${statusClass}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>

                                            {/* Baris 2: Tanggal + Tombol */}
                                            <div className="flex items-end justify-between gap-3 flex-wrap">
                                                {/* Tanggal */}
                                                <div className="flex flex-wrap gap-x-5 gap-y-1">
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
                                                </div>

                                                {/* Tombol Aksi */}
                                                {(loan.status === 'active' || loan.status === 'overdue') && (
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() => handleExtend(loan.id)}
                                                            className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-all active:scale-95"
                                                        >
                                                            Perpanjang
                                                        </button>
                                                        <button
                                                            onClick={() => handleReturn(loan.id)}
                                                            className="px-3 py-1.5 rounded-lg bg-error text-white text-xs font-semibold hover:brightness-110 transition-all active:scale-95"
                                                        >
                                                            Kembalikan
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default Loans;
