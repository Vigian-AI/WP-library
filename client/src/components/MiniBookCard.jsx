import { useNavigate } from 'react-router-dom';

const MiniBookCard = ({ book }) => {
    const navigate = useNavigate();

    const coverSrc = book.cover_image_url || book.image || `https://placehold.co/48x64?text=${encodeURIComponent(book.title.substring(0, 8))}`;

    return (
        <div
            onClick={() => navigate(`/books/${book.id}`)}
            className="flex gap-sm items-center p-sm hover:bg-surface-container-high cursor-pointer transition-all duration-200 group"
        >
            <div className="w-12 h-16 overflow-hidden flex-shrink-0 bg-surface-container shadow-sm">
                <img
                    src={coverSrc}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>
            <div className="min-w-0">
                <p className="text-body-sm font-semibold truncate text-on-surface leading-snug group-hover:text-primary transition-colors">
                    {book.title}
                </p>
                <p className="text-label-md text-on-surface-variant mt-0.5">
                    {book.borrow_count || '1.2K'} Reads
                </p>
            </div>
        </div>
    );
};

export default MiniBookCard;
