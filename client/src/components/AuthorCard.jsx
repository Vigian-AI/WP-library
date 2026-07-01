import { useNavigate } from 'react-router-dom';

const AuthorCard = ({ author }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate('/catalog', { state: { author: author.name } })}
            className="flex items-center justify-between p-sm rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors w-full"
        >
            <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0">
                        <img
                            src={
                                author.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=bfdbfe&color=020617&bold=true&size=36`
                            }
                            alt={author.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                <div className="text-left min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface truncate">{author.name}</p>
                    <p className="text-label-md text-on-surface-variant">Writer & Author</p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-sm">
                <p className="text-body-sm font-bold text-primary-container">{author.book_count || 76}</p>
                <p className="text-label-md text-on-surface-variant">Books</p>
            </div>
        </div>
    );
};

export default AuthorCard;
