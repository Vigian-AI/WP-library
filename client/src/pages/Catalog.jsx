import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../services/api';
import BookCard from '../components/BookCard';
import TopNavBar from '../components/TopNavBar';
import { useAuth } from '../hooks/useAuth';

const Catalog = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [availability, setAvailability] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState('all');

    const fetchData = async () => {
        try {
            const [booksRes, categoriesRes] = await Promise.all([bookAPI.getAll(), categoryAPI.getAll()]);
            setBooks(booksRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        const q = new URLSearchParams(location.search).get('q');
        if (q) handleSearch(q);
        else if (location.state?.categoryId) setSelectedCategory(String(location.state.categoryId));
        else if (location.state?.author) handleSearch(location.state.author);
    }, [location.search, location.state]);

    const handleSearch = async (query) => {
        if (!query) { const res = await bookAPI.getAll(); setBooks(res.data || []); return; }
        const res = await bookAPI.search(query);
        setBooks(res.data || []);
    };

    const filteredBooks = books
        .filter((book) => {
            if (availability === 'available' && book.stock <= 0) return false;
            if (selectedCategory !== 'all' && book.category_id !== parseInt(selectedCategory)) return false;
            if (selectedTopic !== 'all' && !book.description?.toLowerCase().includes(selectedTopic.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (a.rating || 0) return (b.rating || 0) - (a.rating || 0);
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <TopNavBar user={user} onSearch={handleSearch} />

            <div className="px-lg py-md md:px-xl md:py-lg flex flex-col md:flex-row gap-lg">
                <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-lg">
                    <div>
                        <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-md font-bold">Availability</p>
                        <div className="flex flex-col gap-sm">
                            {['all', 'available'].map((value) => (
                                <label key={value} className="flex items-center gap-sm cursor-pointer group">
                                    <input type="radio" checked={availability === value} onChange={() => setAvailability(value)} className="accent-primary w-4 h-4 cursor-pointer" />
                                    <span className={`text-body-sm transition-colors ${availability === value ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>
                                        {value === 'available' ? 'Available Now' : 'All Books'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-md font-bold">Topic</p>
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full bg-surface-container py-2 px-3 text-body-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-colors"
                        >
                            <option value="all">All Topics</option>
                            <option value="science">Science</option>
                            <option value="history">History</option>
                            <option value="philosophy">Philosophy</option>
                            <option value="technology">Technology</option>
                            <option value="art">Art</option>
                        </select>
                    </div>

                    <div>
                        <p className="text-label-md text-on-surface-variant uppercase tracking-widest mb-md font-bold">Category</p>
                        <div className="flex flex-col gap-sm max-h-80 overflow-y-auto pr-1">
                            <label className="flex items-center gap-sm cursor-pointer group">
                                <input type="radio" checked={selectedCategory === 'all'} onChange={() => setSelectedCategory('all')} className="accent-primary w-4 h-4 cursor-pointer" />
                                <span className={`text-body-sm truncate transition-colors ${selectedCategory === 'all' ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>
                                    All Categories
                                </span>
                            </label>
                            {categories.map((cat) => (
                                <label key={cat.id} className="flex items-center gap-sm cursor-pointer group">
                                    <input type="radio" checked={selectedCategory === String(cat.id)} onChange={() => setSelectedCategory(String(cat.id))} className="accent-primary w-4 h-4 cursor-pointer flex-shrink-0" />
                                    <span className={`text-body-sm truncate transition-colors ${selectedCategory === String(cat.id) ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>
                                        {cat.name}
                                    </span>
                                    <span className="text-label-md text-on-surface-variant ml-auto flex-shrink-0 opacity-60">{cat.book_count || 0}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="flex-1">
                    {filteredBooks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
                            {filteredBooks.map((book) => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-on-surface-variant text-body-lg">No books found. Try adjusting your filters.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Catalog;
