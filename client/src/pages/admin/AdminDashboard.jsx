import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { bookAPI, userAPI, categoryAPI } from '../../services/api';
import TopNavBar from '../../components/TopNavBar';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

const inputClass = 'w-full bg-surface-container rounded-lg py-2.5 px-3 border border-outline-variant/40 text-body-sm text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';
const selectClass = inputClass;

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalBooks: 0, activeLoans: 0, overdueLoans: 0, totalUsers: 0 });
    const [logs, setLogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBookModal, setShowBookModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [bookForm, setBookForm] = useState({ isbn: '', title: '', author: '', category_id: '', stock: 5, format: 'Paperback', price: 0 });
    const [userForm, setUserForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'user' });
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, logsRes, usersRes, catRes] = await Promise.all([
                api.get('/stats'), api.get('/logs'), userAPI.getAll(), categoryAPI.getAll()
            ]);
            setStats({
                totalBooks: statsRes.data.bookStats?.total_books || 0,
                activeLoans: statsRes.data.loanStats?.active_loans || 0,
                overdueLoans: statsRes.data.loanStats?.overdue_loans || 0,
                totalUsers: usersRes.data?.length || 0
            });
            setLogs(logsRes.data || []);
            setCategories(catRes.data || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        setModalError(''); setModalSuccess('');
        try {
            await bookAPI.create({ ...bookForm, category_id: parseInt(bookForm.category_id), stock: parseInt(bookForm.stock), price: parseFloat(bookForm.price) });
            setModalSuccess('Book created successfully!');
            setBookForm({ isbn: '', title: '', author: '', category_id: '', stock: 5, format: 'Paperback', price: 0 });
            fetchData();
            setTimeout(() => { setShowBookModal(false); setModalSuccess(''); }, 1500);
        } catch (error) {
            setModalError(error.response?.data?.error || 'Failed to create book');
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setModalError(''); setModalSuccess('');
        try {
            await userAPI.create(userForm);
            setModalSuccess('Member registered successfully!');
            setUserForm({ username: '', email: '', password: '', full_name: '', role: 'user' });
            fetchData();
            setTimeout(() => { setShowUserModal(false); setModalSuccess(''); }, 1500);
        } catch (error) {
            setModalError(error.response?.data?.error || 'Failed to register member');
        }
    };

    const exportLogs = () => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(logs, null, 2))}`;
        const a = document.createElement('a');
        a.href = jsonString; a.download = 'system_activity_logs.json';
        document.body.appendChild(a); a.click(); a.remove();
    };

    const statCards = [
        { label: 'Total Books',    value: stats.totalBooks,   icon: 'menu_book',       color: 'text-primary',           bg: 'bg-primary/10' },
        { label: 'Active Loans',   value: stats.activeLoans,  icon: 'bookmark_added',  color: 'text-secondary',         bg: 'bg-secondary/10' },
        { label: 'Overdue Books',  value: stats.overdueLoans, icon: 'priority_high',   color: 'text-error',             bg: 'bg-error/10',  accent: true },
        { label: 'Total Members',  value: stats.totalUsers,   icon: 'group',           color: 'text-primary-container', bg: 'bg-primary-container/10' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopNavBar user={user} />
            <main className="flex-1 p-lg space-y-lg max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Admin Dashboard</h2>
                        <p className="text-body-sm text-on-surface-variant">System oversight, activity audits, and quick library actions</p>
                    </div>
                    <button onClick={fetchData} className="p-2 bg-surface-container rounded-lg border border-outline-variant/30 hover:bg-surface-container-high transition-colors" title="Refresh">
                        <Icon name="refresh" size={20} className="text-on-surface-variant" />
                    </button>
                </div>

                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                    {statCards.map(({ label, value, icon, color, bg, accent }) => (
                        <div key={label} className={`bg-surface-container-low p-md rounded-xl border border-outline-variant/10 flex items-center justify-between ${accent ? 'border-l-4 border-error/50' : ''}`}>
                            <div>
                                <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                                <p className={`text-headline-xl font-bold ${color}`}>{value}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${bg}`}>
                                <Icon name={icon} size={36} className={color} />
                            </div>
                        </div>
                    ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                    {/* Activity Logs */}
                    <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md space-y-md">
                        <div className="flex justify-between items-center">
                            <h3 className="text-headline-md text-on-surface flex items-center gap-xs">
                                <Icon name="history_toggle_off" size={20} className="text-primary" />
                                System Activity Logs
                            </h3>
                            <button onClick={exportLogs} className="text-primary-container hover:underline text-label-md flex items-center gap-xs">
                                <Icon name="download" size={18} /> Export Logs
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Icon name="sync" size={32} className="text-primary animate-spin" />
                            </div>
                        ) : logs.length === 0 ? (
                            <p className="text-on-surface-variant text-center py-12">No activity logs recorded yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-body-sm text-on-surface-variant">
                                    <thead>
                                        <tr className="border-b border-outline-variant/20 text-on-surface font-semibold">
                                            <th className="py-2">User ID</th>
                                            <th className="py-2">Action</th>
                                            <th className="py-2">Details</th>
                                            <th className="py-2 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/10">
                                        {logs.slice(0, 10).map((log) => (
                                            <tr key={log.id} className="hover:bg-surface-container-high/40 transition-colors">
                                                <td className="py-2.5 font-bold text-on-surface">U-{log.user_id || 'System'}</td>
                                                <td className="py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        log.action.includes('CREATE') ? 'bg-primary/20 text-primary' :
                                                        log.action.includes('DELETE') ? 'bg-error/20 text-error' :
                                                        log.action.includes('BORROW') ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-highest text-on-surface'
                                                    }`}>{log.action}</span>
                                                </td>
                                                <td className="py-2.5 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                                                <td className="py-2.5 text-right">{new Date(log.created_at).toLocaleTimeString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="lg:col-span-4 space-y-lg">
                        <section className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md space-y-md">
                            <h3 className="text-headline-md text-on-surface">Quick Actions</h3>
                            <div className="flex flex-col gap-sm">
                                <button onClick={() => setShowBookModal(true)} className="w-full bg-primary-container text-on-primary font-bold py-3 rounded-lg flex items-center justify-center gap-xs hover:brightness-110 active:scale-95 transition-all text-body-sm">
                                    <Icon name="add" size={20} /> Add New Book
                                </button>
                                <button onClick={() => setShowUserModal(true)} className="w-full border border-outline-variant/40 text-on-surface hover:bg-surface-container-high font-bold py-3 rounded-lg flex items-center justify-center gap-xs active:scale-95 transition-all text-body-sm">
                                    <Icon name="person_add" size={20} /> Register Member
                                </button>
                                <button onClick={() => navigate('/admin/reports')} className="w-full border border-primary/40 text-primary hover:bg-primary/10 font-bold py-3 rounded-lg flex items-center justify-center gap-xs active:scale-95 transition-all text-body-sm">
                                    <Icon name="analytics" size={20} /> View analytics & reports
                                </button>
                            </div>
                        </section>

                        <section className="bg-surface-container rounded-2xl p-md border border-primary-container/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <h3 className="text-headline-md text-primary relative z-10">System Status</h3>
                            <div className="relative z-10 space-y-xs pt-xs">
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-on-surface-variant">API Server</span>
                                    <span className="text-primary font-bold">Online</span>
                                </div>
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-on-surface-variant">Database Engine</span>
                                    <span className="text-primary font-bold">PostgreSQL Connected</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Modal helper */}
            {[
                { show: showBookModal, onClose: () => setShowBookModal(false), title: 'Add New Book', onSubmit: handleBookSubmit,
                  fields: [
                    { label: 'ISBN', key: 'isbn', type: 'text', form: bookForm, setForm: setBookForm },
                    { label: 'Title', key: 'title', type: 'text', form: bookForm, setForm: setBookForm },
                    { label: 'Author', key: 'author', type: 'text', form: bookForm, setForm: setBookForm },
                  ],
                  extra: (
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
                            <input type="number" value={bookForm.stock} onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })} required min="1" className={inputClass} />
                        </div>
                    </div>
                  ),
                  btnLabel: 'Create Book',
                },
            ].map(({ show, onClose, title, onSubmit, fields, extra, btnLabel }) =>
                show ? (
                    <div key={title} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
                        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-md w-[480px] w-full space-y-md shadow-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-headline-md font-bold text-on-surface">{title}</h3>
                                <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
                                    <Icon name="close" size={22} />
                                </button>
                            </div>
                            {modalError && <div className="bg-error-container/20 text-error p-2.5 rounded-lg text-body-sm border border-error/30">{modalError}</div>}
                            {modalSuccess && <div className="bg-primary-container/20 text-primary p-2.5 rounded-lg text-body-sm border border-primary-container/30">{modalSuccess}</div>}
                            <form onSubmit={onSubmit} className="space-y-sm">
                                {fields.map(({ label, key, type, form, setForm }) => (
                                    <div key={key}>
                                        <label className="block text-label-md mb-1 text-on-surface-variant">{label}</label>
                                        <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required className={inputClass} />
                                    </div>
                                ))}
                                {extra}
                                <button type="submit" className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:brightness-110 transition-all text-body-sm">{btnLabel}</button>
                            </form>
                        </div>
                    </div>
                ) : null
            )}

            {/* Register Member Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md">
                    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-md w-[480px] w-full space-y-md shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-headline-md font-bold text-on-surface">Register Member</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-on-surface-variant hover:text-on-surface">
                                <Icon name="close" size={22} />
                            </button>
                        </div>
                        {modalError && <div className="bg-error-container/20 text-error p-2.5 rounded-lg text-body-sm border border-error/30">{modalError}</div>}
                        {modalSuccess && <div className="bg-primary-container/20 text-primary p-2.5 rounded-lg text-body-sm border border-primary-container/30">{modalSuccess}</div>}
                        <form onSubmit={handleUserSubmit} className="space-y-sm">
                            {[
                                { label: 'Full Name', key: 'full_name', type: 'text' },
                                { label: 'Username',  key: 'username',  type: 'text' },
                                { label: 'Email',     key: 'email',     type: 'email' },
                            ].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">{label}</label>
                                    <input type={type} value={userForm[key]} onChange={(e) => setUserForm({ ...userForm, [key]: e.target.value })} required className={inputClass} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-sm">
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Password</label>
                                    <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Role</label>
                                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className={selectClass}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:brightness-110 transition-all text-body-sm">
                                Register Member
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
