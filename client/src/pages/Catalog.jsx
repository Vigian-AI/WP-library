import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../services/api';
import BookCard from '../components/BookCard';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

const topicTranslations = {
    all: 'Semua',
    science: 'Sains',
    history: 'Sejarah',
    philosophy: 'Filsafat',
    technology: 'Teknologi',
    art: 'Seni'
};

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
            {/* Header */}
            <header className="px-space-lg py-space-md md:px-space-xl md:py-space-md border-b border-outline-variant/10">
                <div className="max-w-[var(--width-app)] mx-auto w-full flex justify-between items-end">
                    <div>
                        <span className="text-primary font-semibold text-label-md tracking-widest uppercase">Katalog</span>
                        <h2 className="text-headline-lg font-bold text-on-surface mt-1">Jelajahi Buku</h2>
                    </div>
                    <p className="text-body-sm text-on-surface-variant hidden md:block">
                        Menampilkan <span className="font-bold text-primary">{filteredBooks.length}</span> buku
                    </p>
                </div>
            </header>

            <div className="px-space-lg py-space-lg md:px-space-xl md:py-space-lg flex flex-col md:flex-row gap-space-lg max-w-[var(--width-app)] mx-auto w-full flex-1">
                {/* Aside Filters */}
                <aside className="w-full md:w-[280px] flex-shrink-0 flex flex-col gap-space-md">
                    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-space-md space-y-space-md shadow-sm">
                        {/* Header Filters */}
                        <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/10">
                            <span className="font-semibold text-on-surface flex items-center gap-space-xs">
                                <Icon name="filter_alt" size={18} className="text-primary" /> Filter
                            </span>
                            <button 
                                onClick={() => { setAvailability('all'); setSelectedCategory('all'); setSelectedTopic('all'); }}
                                className="text-label-md text-primary hover:underline font-bold"
                            >
                                Atur Ulang
                            </button>
                        </div>

                        {/* Availability Toggle */}
                        <div className="space-y-space-xs">
                            <label className="text-label-md text-on-surface-variant tracking-wider uppercase font-bold">Ketersediaan</label>
                            <div className="grid grid-cols-2 p-1 bg-surface-container rounded-lg border border-outline-variant/20">
                                <button 
                                    onClick={() => setAvailability('all')}
                                    className={`py-1.5 text-body-sm font-semibold rounded-md transition-all ${availability === 'all' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    Semua
                                </button>
                                <button 
                                    onClick={() => setAvailability('available')}
                                    className={`py-1.5 text-body-sm font-semibold rounded-md transition-all ${availability === 'available' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    Tersedia
                                </button>
                            </div>
                        </div>

                        {/* Topic Pill Filters */}
                        <div className="space-y-space-xs">
                            <label className="text-label-md text-on-surface-variant tracking-wider uppercase font-bold">Topik</label>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'science', 'history', 'philosophy', 'technology', 'art'].map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`px-3 py-1.5 text-body-sm font-semibold rounded-full border transition-all ${selectedTopic === topic ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container/50 border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-on-surface'}`}
                                    >
                                        {topicTranslations[topic] || topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category List */}
                        <div className="space-y-space-xs">
                            <label className="text-label-md text-on-surface-variant tracking-wider uppercase font-bold">Kategori</label>
                            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-1">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${selectedCategory === 'all' ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
                                >
                                    <span className="text-body-sm">Semua Kategori</span>
                                    <span className="text-label-md opacity-60">{books.length}</span>
                                </button>

                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(String(cat.id))}
                                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-all ${selectedCategory === String(cat.id) ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
                                    >
                                        <span className="text-body-sm truncate pr-2">{cat.name}</span>
                                        <span className="text-label-md opacity-60 flex-shrink-0">{cat.book_count || 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Book Grid */}
                <main className="flex-1">
                    {filteredBooks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-gutter">
                            {filteredBooks.map((book) => (
                                <BookCard key={book.id} book={book} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center bg-surface border border-outline-variant/30 rounded-2xl p-space-md shadow-sm">
                            <Icon name="search_off" size={48} className="text-on-surface-variant/40 mx-auto mb-space-sm" />
                            <p className="text-on-surface text-body-lg font-semibold">Buku tidak ditemukan</p>
                            <p className="text-on-surface-variant text-body-sm mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda untuk mencari koleksi lainnya.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Catalog;
