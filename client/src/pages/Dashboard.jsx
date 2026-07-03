// Fixed Dashboard component for syntax errors
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAPI, loanAPI, categoryAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [borrowedBooks, setBorrowedBooks] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [loansRes, arrivalsRes, categoriesRes] = await Promise.all([
                    loanAPI.getActiveByUser(user?.id),
                    bookAPI.getNewArrivals(6),
                    categoryAPI.getAll()
                ]);
                setBorrowedBooks(loansRes.data || []);
                setNewArrivals(arrivalsRes.data || []);
                setCategories(categoriesRes.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleContinueReading = () => {
        if (borrowedBooks.length > 0) {
            navigate(`/books/${borrowedBooks[0].book_id || borrowedBooks[0].id}`);
        } else {
            navigate('/loans');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-lg lg:px-xl lg:py-xl max-w-[var(--width-app)] mx-auto w-full space-y-xl">

                {/* Hero Section */}
                <section className="relative overflow-hidden h-[300px] flex items-start pt-10 px-lg bg-gradient-to-br from-primary/10 via-surface-container-low to-surface-container shadow-sm">
                    <div className="max-w-2xl space-y-md relative z-10">
                        <h2 className="text-[48px] leading-tight font-bold text-primary">
                            Selamat datang kembali, {user?.full_name?.split(' ')[0] || 'Tamu'}!
                        </h2>
                        <p className="text-[18px] text-on-surface-variant max-w-lg">
                            Lanjutkan petualangan Anda di dunia pengetahuan. Saat ini Anda sedang meminjam{' '}
                            <span className="text-on-surface font-bold">{borrowedBooks.length}</span>{' '}
                            buku.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-sm">
                            <Button
                                onClick={handleContinueReading}
                                variant="primary"
                                icon="play_circle"
                                className="px-8"
                            >
                                Lanjutkan Membaca
                            </Button>
                            <Button
                                onClick={() => navigate('/catalog')}
                                variant="outline"
                                className="px-8"
                            >
                                Jelajahi Katalog
                            </Button>
                        </div>
                    </div>
                    {/* Decorative Element/Illustration Placeholder */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none flex items-center justify-center">
                         <Icon name="auto_stories" size={260} className="text-primary" />
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                    {/* Left Column - Full Width */}
                    <div className="lg:col-span-12 space-y-xl">
                        {/* Previous Reading */}
                        <section className="space-y-md">
                            <div className="flex items-center justify-between">
                                <h3 className="text-headline-lg text-on-surface font-bold">Bacaan Sebelumnya</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/loans')}
                                    className="px-0"
                                >
                                    Kelola Peminjaman <Icon name="arrow_forward" size={16} className="ml-1" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
                                {borrowedBooks.length > 0 ? (
                                    borrowedBooks.map((loan) => <BookCard key={loan.id} book={loan} />)
                                ) : (
                                    <div className="col-span-full py-12 bg-surface-container/30 text-center">
                                        <p className="text-on-surface-variant italic">Belum ada buku yang dipinjam. Mulai menjelajah!</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Subjects */}
                        <section className="space-y-md">
                            <h3 className="text-headline-lg text-on-surface font-bold">Kategori</h3>
                            <div className="flex flex-wrap gap-sm">
                                {categories.slice(0, 12).map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => navigate('/catalog', { state: { categoryId: cat.id } })}
                                        className="px-4 py-2 bg-surface-container border border-outline-variant/20 hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all text-center group"
                                    >
                                        <span className="text-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{cat.name}</span>
                                        <span className="text-label-md text-on-surface-variant ml-2 opacity-60">{cat.book_count || 0}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* New Books */}
                        <section className="space-y-md">
                            <div className="flex items-center justify-between">
                                <h3 className="text-headline-lg text-on-surface font-bold">Buku Baru</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/catalog')}
                                    className="px-0"
                                >
                                    Lihat semua
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
                                {newArrivals.map((book) => (
                                    <BookCard key={book.id} book={book} showStatus={false} />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>


            <footer className="mt-auto p-md text-center bg-surface-container-low/50 border-t border-outline-variant/10">
                <p className="text-label-md text-on-surface-variant">© 2024 Perpustakaan Digital. Hak Cipta Dilindungi.</p>
            </footer>
        </div>
    );
};

export default Dashboard;
