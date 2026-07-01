import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from './Button';

const BookCard = ({ book, onWishlist, showStatus = true }) => {
    const navigate = useNavigate();
    const isAvailable = book.stock > 0;

    const coverSrc = book.cover_image_url || `https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`;

    const handleCardClick = (e) => {
        if (e.target.closest('button')) return;
        navigate(`/books/${book.book_id || book.id}`);
    };

    const [imgSrc, setImgSrc] = useState(coverSrc);

    const handleImgError = () => {
        setImgSrc(`https://placehold.co/300x450?text=${encodeURIComponent(book.title)}`);
    };

    return (
        <article
            onClick={handleCardClick}
            className="group cursor-pointer flex flex-col overflow-hidden h-full bg-surface transition-all duration-300 hover:shadow-md"
        >
            {/* Cover */}
            <div className="relative overflow-hidden bg-surface-container" style={{aspectRatio: '2/3', minHeight: '200px'}}>
                <img
                    src={imgSrc}
                    alt={book.title}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError={handleImgError}
                />
                {showStatus && (
                    <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-bold tracking-wide backdrop-blur-md transition-all duration-300 ${
                        isAvailable
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container-low/80 text-on-surface-variant'
                    }`}>
                        {isAvailable ? 'AVAILABLE' : 'BORROWED'}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-sm flex flex-col flex-1">
                <p className="text-body-sm font-bold text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {book.title}
                </p>
                <p className="text-label-md text-on-surface-variant truncate mt-1">
                    {book.author}
                </p>
                <div className="mt-auto pt-sm flex justify-between items-center mt-md">
                    <span className="text-label-md text-on-surface-variant font-medium">
                        {book.borrow_count || book.rating || '0'} <span className="opacity-70">Reads</span>
                    </span>
                    {onWishlist && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon="favorite_border"
                            className="p-0 min-w-0 h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); onWishlist(book.book_id || book.id); }}
                            title="Add to wishlist"
                        >
                            {/* Empty span to maintain sizing if needed, or just icon */}
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default BookCard;