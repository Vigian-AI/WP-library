import { useEffect, useState } from 'react';
import { wishlistAPI, bookAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

const Wishlist = () => {
    const { user } = useAuth();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, [user?.id]);

    const fetchWishlist = async () => {
        try {
            const response = await wishlistAPI.getAll();
            setWishlistItems(response.data || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (bookId) => {
        try {
            await wishlistAPI.remove(bookId);
            setWishlistItems(wishlistItems.filter(item => item.book_id !== bookId));
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const handleBorrow = async (bookId) => {
        try {
            await bookAPI.borrow(bookId);
            fetchWishlist();
        } catch (error) {
            alert(error.response?.data?.error || 'Gagal meminjam buku');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-lg">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-lg">
                        <h2 className="text-headline-lg text-on-surface">Daftar Favorit Saya</h2>
                        <p className="text-body-sm text-on-surface-variant">Buku-buku yang ingin Anda baca nanti</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon name="sync" size={48} className="text-primary animate-spin" />
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon name="favorite" size={48} className="text-on-surface-variant" />
                            <p className="text-body-md text-on-surface-variant mt-4">
                                Daftar favorit Anda kosong. Jelajahi katalog untuk menambahkan buku.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-gutter">
                            {wishlistItems.map((item) => (
                                <div key={item.id} className="relative">
                                    <BookCard book={item} onBorrow={handleBorrow} />
                                    <button
                                        onClick={() => handleRemove(item.book_id)}
                                        className="absolute top-2 left-2 w-8 h-8 bg-error/80 hover:bg-error text-white rounded-full flex items-center justify-center z-10 transition-colors"
                                        title="Hapus dari favorit"
                                    >
                                        <Icon name="close" size={16} className="text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Wishlist;
