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

    const filteredLoans = loans.filter((loan) => {
        const isActive = loan.status === 'active' || loan.status === 'overdue';
        return activeTab === 'active' ? isActive : !isActive;
    });

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-lg">
                <div className="max-w-4xl mx-auto space-y-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md">
                        <div>
                            <h2 className="text-headline-lg text-on-surface">
                                {activeTab === 'active' ? 'Buku yang Saya Pinjam' : 'Riwayat Membaca Saya'}
                            </h2>
                            <p className="text-body-sm text-on-surface-variant">
                                {activeTab === 'active'
                                    ? 'Kelola peminjaman aktif Anda dan pantau tanggal jatuh tempo'
                                    : 'Tinjau semua buku yang telah Anda baca sebelumnya'}
                            </p>
                        </div>

                        {/* Tab switcher */}
                                    <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 border border-outline-variant/20 self-start">
                                        {['active', 'history'].map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-4 py-1.5 rounded-md text-label-md font-semibold transition-all ${
                                                    activeTab === tab
                                                        ? 'bg-primary text-on-primary'
                                                        : 'hover:bg-surface-container-highest text-on-surface-variant'
                                                }`}
                                            >
                                                {tab === 'active' ? 'Peminjaman Aktif' : 'Riwayat Peminjaman'}
                                            </button>
                                        ))}
                                    </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon name="sync" size={48} className="text-primary animate-spin" />
                        </div>
                    ) : filteredLoans.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon
                                name={activeTab === 'active' ? 'collections_bookmark' : 'history'}
                                size={48}
                                className="text-on-surface-variant"
                            />
                            <p className="text-body-md text-on-surface-variant mt-4">
                                {activeTab === 'active'
                                    ? 'Tidak ada peminjaman aktif. Jelajahi katalog untuk meminjam buku.'
                                    : 'Anda belum memiliki riwayat membaca.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-md">
                            {filteredLoans.map((loan) => {
                                const overdue = isOverdue(loan.due_date);
                                return (
                                    <div
                                        key={loan.id}
                                        className="bg-surface-container-low rounded-xl p-md border border-outline-variant/20 flex flex-col sm:flex-row gap-md items-start sm:items-center justify-between"
                                    >
                                        <div className="flex gap-md w-full">
                                            <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container shadow-md">
                                                <img
                                                    src={loan.cover_image_url || `https://placehold.co/80x120?text=${encodeURIComponent(loan.title.substring(0, 10))}`}
                                                    alt={loan.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-xs min-w-0">
                                                <h3 className="text-body-md font-bold text-on-surface truncate">{loan.title}</h3>
                                                <p className="text-body-sm text-on-surface-variant truncate">{loan.author}</p>
                                                <div className="grid grid-cols-2 gap-x-md gap-y-xs pt-xs text-label-md">
                                                    <p>
                                                        <span className="text-on-surface-variant">Dipinjam: </span>
                                                        <span className="text-on-surface font-semibold">{new Date(loan.loan_date).toLocaleDateString()}</span>
                                                    </p>
                                                    <p>
                                                        <span className="text-on-surface-variant">Jatuh Tempo: </span>
                                                        <span className={`font-semibold ${overdue && loan.status !== 'returned' ? 'text-error' : 'text-on-surface'}`}>
                                                            {new Date(loan.due_date).toLocaleDateString()}
                                                        </span>
                                                    </p>
                                                    {loan.return_date && (
                                                        <p className="col-span-2">
                                                            <span className="text-on-surface-variant">Dikembalikan: </span>
                                                            <span className="text-primary font-semibold">{new Date(loan.return_date).toLocaleDateString()}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-end gap-sm w-full sm:w-auto pt-sm sm:pt-0 border-t sm:border-t-0 border-outline-variant/10">
                                            <div className="mr-auto sm:mr-0">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    loan.status === 'returned' ? 'bg-primary-container/20 text-primary'
                                                    : overdue ? 'bg-error/20 text-error'
                                                    : 'bg-secondary-container/50 text-secondary'
                                                }`}>
                                                    {loan.status === 'returned' ? 'Dikembalikan' : overdue ? 'Terlambat' : 'Aktif'}
                                                </span>
                                            </div>
                                            {(loan.status === 'active' || loan.status === 'overdue') && (
                                                <div className="flex gap-sm">
                                                  <button
                                                      onClick={() => handleExtend(loan.id)}
                                                      className="px-lg py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all text-label-md font-bold active:scale-95"
                                                  >
                                                      Perpanjang
                                                  </button>
                                                    <button
                                                        onClick={() => handleReturn(loan.id)}
                                                        className="px-lg py-2 rounded-lg bg-error text-on-error hover:brightness-110 transition-all text-label-md font-bold active:scale-95"
                                                    >
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
    );
};

export default Loans;
