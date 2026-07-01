import { useEffect, useState } from 'react';
import { bookAPI, categoryAPI } from '../../services/api';
import TopNavBar from '../../components/TopNavBar';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

const inputClass = 'w-full bg-surface-container rounded-lg py-2.5 px-3 border border-outline-variant/40 text-body-sm text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';
const selectClass = inputClass;

const AdminInventory = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editBookId, setEditBookId] = useState(null);
    const [bookForm, setBookForm] = useState({ isbn: '', title: '', author: '', category_id: '', stock: 5, format: 'Paperback', price: 0, cover_image_url: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [booksRes, catRes] = await Promise.all([bookAPI.getAll(), categoryAPI.getAll()]);
            setBooks(booksRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchTerm) { fetchData(); return; }
        setLoading(true);
        try {
            const res = await bookAPI.search(searchTerm);
            setBooks(res.data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditBookId(null);
        setBookForm({ isbn: '', title: '', author: '', category_id: '', stock: 5, format: 'Paperback', price: 0, cover_image_url: '' });
        setError(''); setSuccess(''); setShowModal(true);
    };

    const handleOpenEdit = (book) => {
        setEditBookId(book.id);
        setBookForm({ isbn: book.isbn, title: book.title, author: book.author, category_id: book.category_id || '', stock: book.stock, format: book.format || 'Paperback', price: book.price || 0, cover_image_url: book.cover_image_url || '' });
        setError(''); setSuccess(''); setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            const payload = { ...bookForm, category_id: bookForm.category_id ? parseInt(bookForm.category_id) : null, stock: parseInt(bookForm.stock), price: parseFloat(bookForm.price) };
            if (editBookId) { await bookAPI.update(editBookId, payload); setSuccess('Book updated successfully!'); }
            else { await bookAPI.create(payload); setSuccess('Book created successfully!'); }
            fetchData();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 1200);
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this book?')) return;
        try { await bookAPI.delete(id); alert('Book deleted successfully'); fetchData(); }
        catch (err) { alert(err.response?.data?.error || 'Failed to delete book'); }
    };

    const totalPhysical = books.filter(b => b.format !== 'Digital' && b.format !== 'eBook').reduce((s, b) => s + (b.stock || 0), 0);
    const totalDigital  = books.filter(b => b.format === 'Digital' || b.format === 'eBook').reduce((s, b) => s + (b.stock || 0), 0);
    const outOfStock    = books.filter(b => b.stock <= 0).length;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopNavBar user={user} />
            <main className="flex-1 p-lg space-y-lg max-w-7xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-md">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Book Inventory Management</h2>
                        <p className="text-body-sm text-on-surface-variant">Monitor stocks, license types, and library assets</p>
                    </div>
                    <button onClick={handleOpenAdd} className="bg-primary-container text-on-primary font-bold px-lg py-3 rounded-lg flex items-center gap-xs hover:brightness-110 active:scale-95 transition-all text-body-sm self-start">
                        <Icon name="add" size={20} /> Add New Book
                    </button>
                </div>

                {/* Stock indicators */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10">
                        <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Physical Book Copies</p>
                        <p className="text-headline-lg font-bold text-primary">{totalPhysical} units</p>
                        <div className="w-full bg-surface-container-highest h-2 rounded-full mt-sm overflow-hidden">
                            <div className="bg-primary h-full" style={{ width: `${Math.min(100, (totalPhysical / (totalPhysical + totalDigital || 1)) * 100)}%` }} />
                        </div>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10">
                        <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Digital Licenses</p>
                        <p className="text-headline-lg font-bold text-secondary">{totalDigital} active</p>
                        <div className="w-full bg-surface-container-highest h-2 rounded-full mt-sm overflow-hidden">
                            <div className="bg-secondary h-full" style={{ width: `${Math.min(100, (totalDigital / (totalPhysical + totalDigital || 1)) * 100)}%` }} />
                        </div>
                    </div>
                    <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10 border-l-4 border-error/50">
                        <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Out of Stock Books</p>
                        <p className="text-headline-lg font-bold text-error">{outOfStock} titles</p>
                        <p className="text-label-md text-on-surface-variant mt-sm">Requires immediate restock</p>
                    </div>
                </section>

                {/* Table */}
                <section className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md space-y-md">
                    <form onSubmit={handleSearchSubmit} className="relative w-full w-[320px]">
                        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by ISBN, title, author…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-container rounded-full py-2 pl-10 pr-4 text-body-sm text-on-surface border border-outline-variant/40 focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors"
                        />
                    </form>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon name="sync" size={32} className="text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-body-sm text-on-surface-variant">
                                <thead>
                                    <tr className="border-b border-outline-variant/20 text-on-surface font-semibold">
                                        <th className="py-2">Cover</th>
                                        <th className="py-2">Book Details</th>
                                        <th className="py-2">Category</th>
                                        <th className="py-2">Stock Status</th>
                                        <th className="py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {books.map((book) => {
                                        const category = categories.find(c => c.id === book.category_id);
                                        const isOutOfStock = book.stock <= 0;
                                        return (
                                            <tr key={book.id} className="hover:bg-surface-container-high/40 transition-colors">
                                                <td className="py-2.5">
                                                    <div className="w-10 h-14 rounded overflow-hidden bg-surface-container">
                                                        <img src={book.cover_image_url || book.image || `https://placehold.co/40x60?text=${encodeURIComponent(book.title.substring(0, 5))}`} alt={book.title} className="w-full h-full object-cover" />
                                                    </div>
                                                </td>
                                                <td className="py-2.5">
                                                    <p className="font-bold text-on-surface line-clamp-1">{book.title}</p>
                                                    <p className="text-label-md text-on-surface-variant">{book.author} | ISBN: {book.isbn}</p>
                                                    <span className="text-[10px] bg-secondary-container/30 text-secondary px-1.5 py-0.5 rounded uppercase font-bold">{book.format || 'Paperback'}</span>
                                                </td>
                                                <td className="py-2.5">{category ? category.name : 'Uncategorized'}</td>
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-xs">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-error' : book.stock < 3 ? 'bg-primary-container' : 'bg-primary'}`} />
                                                        <span className="text-body-sm font-semibold text-on-surface">{book.stock} Available</span>
                                                    </div>
                                                    <span className="text-[10px] text-on-surface-variant block">{isOutOfStock ? 'Restock needed' : 'In stock'}</span>
                                                </td>
                                                <td className="py-2.5 text-right space-x-sm">
                                                    <button onClick={() => handleOpenEdit(book)} className="text-primary-container hover:text-primary transition-colors" title="Edit">
                                                        <Icon name="edit" size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(book.id)} className="text-error hover:text-red-400 transition-colors" title="Delete">
                                                        <Icon name="delete" size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
                    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-md w-[480px] w-full space-y-md shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-headline-md font-bold text-on-surface">{editBookId ? 'Edit Book Details' : 'Add New Book'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                                <Icon name="close" size={22} />
                            </button>
                        </div>
                        {error && <div className="bg-error-container/20 text-error p-2.5 rounded-lg text-body-sm border border-error/30">{error}</div>}
                        {success && <div className="bg-primary-container/20 text-primary p-2.5 rounded-lg text-body-sm border border-primary-container/30">{success}</div>}
                        <form onSubmit={handleSubmit} className="space-y-sm">
                            {[
                                { label: 'ISBN',  key: 'isbn',  disabled: !!editBookId },
                                { label: 'Title', key: 'title' },
                                { label: 'Author', key: 'author' },
                                { label: 'Cover Image URL', key: 'cover_image_url', required: false, placeholder: 'https://example.com/cover.jpg' },
                            ].map(({ label, key, disabled, required = true, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">{label}</label>
                                    <input type="text" value={bookForm[key]} onChange={(e) => setBookForm({ ...bookForm, [key]: e.target.value })} required={required} disabled={disabled} placeholder={placeholder} className={`${inputClass} ${disabled ? 'disabled:opacity-50' : ''}`} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Category</label>
                                    <select value={bookForm.category_id} onChange={(e) => setBookForm({ ...bookForm, category_id: e.target.value })} required className={selectClass}>
                                        <option value="">Select Category</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Stock</label>
                                    <input type="number" value={bookForm.stock} onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })} required min="0" className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Format</label>
                                    <select value={bookForm.format} onChange={(e) => setBookForm({ ...bookForm, format: e.target.value })} className={selectClass}>
                                        {['Paperback', 'Hardcover', 'Digital', 'eBook'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Price ($)</label>
                                    <input type="number" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} required min="0" step="0.01" className={inputClass} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:brightness-110 transition-all text-body-sm">
                                {editBookId ? 'Save Changes' : 'Create Book'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
