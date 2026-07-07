import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI, wishlistAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const BookDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [book, setBook] = useState(null);
    const [similarBooks, setSimilarBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const bookRes = await bookAPI.getById(id);
                setBook(bookRes.data);

                try {
                    const similarRes = await bookAPI.getSimilar(id, 5);
                    setSimilarBooks(similarRes.data || []);
                } catch (similarError) {
                    console.error('Error fetching similar books:', similarError);
                    setSimilarBooks([]);
                }
            } catch (error) {
                console.error('Error fetching book:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    const handleBorrow = async () => {
        try {
            await bookAPI.borrow(id);
            alert('Buku berhasil dipinjam!');
            navigate('/loans');
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal meminjam buku');
        }
    };

    const handleWishlist = async () => {
        try {
            await wishlistAPI.add(id);
            alert('Berhasil ditambahkan ke favorit!');
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal menambahkan ke favorit');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Icon name="sync" size={48} className="text-primary animate-spin" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <main className="flex-1 p-lg text-center">
                    <h2 className="text-headline-lg">Buku tidak ditemukan</h2>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/catalog')}
                        className="mt-md"
                    >
                        Kembali ke Katalog
                    </Button>
                </main>
            </div>
        );
    }

    const pageCount = ((book.isbn ? parseInt(book.isbn.substring(3, 7)) % 300 : 0) + 120) || 280;

    const metaItems = [
        { label: 'Kategori', value: book.category_name || 'N/A' },
        { label: 'Format',   value: book.format || 'Paperback' },
        { label: 'ISBN',     value: book.isbn || 'N/A' },
        { label: 'Stok',     value: book.stock > 0 ? `${book.stock} tersedia` : 'Stok habis' },
        { label: 'Halaman',  value: `${pageCount} halaman` },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 px-lg py-md lg:px-xl lg:py-lg">
                <div className="max-w-4xl mx-auto">

                    {/* Tombol Kembali */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6"
                    >
                        <Icon name="arrow_back" size={18} />
                        <span>Kembali</span>
                    </button>

                    {/* Layout Utama */}
                    <div className="flex flex-col md:flex-row gap-8">

                        {/* Cover */}
                        <div className="w-full md:w-56 flex-shrink-0">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container shadow-lg">
                                <img
                                    src={book.cover_image_url || book.image || `https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Detail */}
                        <div className="flex-1 flex flex-col gap-5">

                            {/* Judul & Penulis */}
                            <div>
                                <h1 className="text-2xl font-bold text-on-surface leading-tight">{book.title}</h1>
                                <p className="text-base text-on-surface-variant mt-1">{book.author}</p>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Icon name="star" size={18} className="text-primary" />
                                    <span className="text-sm font-semibold text-on-surface">
                                        {book.rating || book.book_depository_stars || '4.5'}
                                    </span>
                                </div>
                                <span className="text-on-surface-variant/40">|</span>
                                <span className="text-sm text-on-surface-variant">{book.borrow_count || 0} kali dibaca</span>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                {metaItems.map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-0.5">
                                            {label}
                                        </p>
                                        <p className="text-sm text-on-surface">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Sinopsis */}
                            <div className="border-t border-outline-variant/20 pt-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                                    Sinopsis
                                </p>
                                <p className="text-sm text-on-surface-variant leading-relaxed">
                                    {book.description ||
                                        `Telusuri kisah menarik "${book.title}" karya ${book.author}. Buku ini mengeksplorasi tema-tema ${book.category_name || 'minat umum'} dengan gaya yang imersif dan menggugah pikiran. Sangat direkomendasikan untuk pelajar, peneliti, dan pembaca umum.`}
                                </p>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex gap-3 pt-1">
                                {book.stock > 0 ? (
                                    <button
                                        onClick={handleBorrow}
                                        className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:brightness-110 transition-all active:scale-95"
                                    >
                                        Pinjam Sekarang
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-6 py-2.5 rounded-lg bg-surface-container text-on-surface-variant text-sm font-semibold cursor-not-allowed"
                                    >
                                        Tidak Tersedia
                                    </button>
                                )}
                                <button
                                    onClick={handleWishlist}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant/50 text-on-surface text-sm font-semibold hover:bg-surface-container transition-all active:scale-95"
                                >
                                    <Icon name="favorite_border" size={16} />
                                    Favorit
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* Buku Serupa */}
                    {similarBooks.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-xl font-bold text-on-surface mb-5">Buku Serupa</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {similarBooks.map((similarBook) => (
                                    <BookCard key={similarBook.id} book={similarBook} />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default BookDetail;
