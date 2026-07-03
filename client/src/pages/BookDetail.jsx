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
                const [bookRes, similarRes] = await Promise.all([
                    bookAPI.getById(id),
                    bookAPI.getSimilar(id, 5)
                ]);
                setBook(bookRes.data);
                setSimilarBooks(similarRes.data || []);
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

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 px-lg py-md lg:px-xl lg:py-lg">
                <div className="max-w-4xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon="arrow_back"
                        onClick={() => navigate(-1)}
                        className="mb-lg px-0"
                    >
                        Kembali
                    </Button>

                    <div className="flex flex-col md:flex-row gap-lg">
                        {/* Cover */}
                        <div className="w-full md:w-64 flex-shrink-0">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-surface-container shadow-lg">
                                <img
                                    src={book.cover_image_url || book.image || `https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-md">
                            <div>
                                <h1 className="text-headline-lg text-on-surface font-bold">{book.title}</h1>
                                <p className="text-body-lg text-on-surface-variant">{book.author}</p>
                            </div>

                            {/* Rating row */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <Icon name="star" size={20} className="text-primary" />
                                    <span className="text-body-md font-semibold text-on-surface">
                                        {book.rating || book.book_depository_stars || '4.5'}
                                    </span>
                                </div>
                                <span className="text-body-sm text-on-surface-variant">|</span>
                                <span className="text-body-sm text-on-surface-variant">{book.borrow_count || 0} kali dibaca</span>
                            </div>

                            {/* Metadata grid */}
                            <div className="grid grid-cols-2 gap-md">
                                {[
                                    { label: 'Kategori', value: book.category_name || 'N/A' },
                                    { label: 'Format',   value: book.format || 'Paperback' },
                                    { label: 'ISBN',     value: book.isbn },
                                    { label: 'Stok',    value: book.stock > 0 ? `${book.stock} tersedia` : 'Stok habis' },
                                    { label: 'Halaman',    value: `${((book.isbn ? parseInt(book.isbn.substring(3, 7)) % 300 : 0) + 120) || 280} halaman` },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-label-md text-on-surface-variant uppercase tracking-wide">{label}</p>
                                        <p className="text-body-md text-on-surface">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Synopsis */}
                            <div className="pt-sm border-t border-outline-variant/20">
                                <p className="text-label-md text-on-surface-variant uppercase tracking-wide mb-2">Sinopsis</p>
                                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                                    {book.description ||
                                        `Telusuri kisah menarik "${book.title}" karya ${book.author}. Buku ini mengeksplorasi tema-tema ${book.category_name || 'minat umum'} dengan gaya yang imersif dan menggugah pikiran. Sangat direkomendasikan untuk pelajar, peneliti, dan pembaca umum.`}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-md pt-md">
                                {book.stock > 0 ? (
                                    <Button
                                        variant="primary"
                                        onClick={handleBorrow}
                                        className="flex-1 sm:flex-none"
                                    >
                                        Pinjam Sekarang
                                    </Button>
                                ) : (
                                    <Button disabled variant="secondary" className="flex-1 sm:flex-none">
                                        Tidak Tersedia
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    icon="favorite_border"
                                    onClick={handleWishlist}
                                    className="flex-1 sm:flex-none"
                                >
                                    Favorit
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Similar books */}
                    {similarBooks.length > 0 && (
                        <div className="mt-xl">
                            <h3 className="text-headline-lg text-on-surface font-bold mb-md">Buku Serupa</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
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
