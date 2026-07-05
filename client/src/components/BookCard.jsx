import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from './Button';

const BookCard = ({ book, onWishlist, showStatus = true }) => {
    const navigate = useNavigate();
    const isAvailable = book.stock > 0;

    const coverSrc = book.cover_image_url || `https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`;
    const [imgSrc, setImgSrc] = useState(coverSrc);

    const handleCardClick = (e) => {
        if (e.target.closest('button')) return;
        navigate(`/books/${book.book_id || book.id}`);
    };

    const handleImgError = () => {
        setImgSrc(`https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`);
    };

    return (
        <article
            onClick={handleCardClick}
            className="group cursor-pointer flex flex-col overflow-hidden h-full bg-surface transition-all duration-300 hover:shadow-md rounded-lg"
        >
            {/* Cover */}
            <div className="relative overflow-hidden bg-surface-container" style={{ aspectRatio: '2/3' }}>
                <img
                    src={imgSrc}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError={handleImgError}
                />
                {showStatus && (
                    <span className={`absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-bold tracking-wide rounded backdrop-blur-sm ${
                        isAvailable
                            ? 'bg-primary/80 text-white'
                            : 'bg-black/40 text-white/80'
                    }`}>
                        {isAvailable ? 'Tersedia' : 'Dipinjam'}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-2 flex flex-col flex-1">
                <p className="text-xs font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {book.title}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                    {book.author}
                </p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant">
                        {book.borrow_count || book.rating || '0'} <span className="opacity-60">reads</span>
                    </span>
                    {onWishlist && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon="favorite_border"
                            className="p-0 min-w-0 h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); onWishlist(book.book_id || book.id); }}
                            title="Tambah ke wishlist"
                        />
                    )}
                </div>
            </div>
        </article>
    );
};

export default BookCard;
