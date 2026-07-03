import { useEffect, useState } from 'react';
import { userAPI } from '../../services/api';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

const inputClass = 'w-full bg-surface-container rounded-lg py-2.5 px-3 border border-outline-variant/40 text-body-sm text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [userForm, setUserForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'user' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try { const res = await userAPI.getAll(); setUsers(res.data || []); }
        catch (err) { console.error('Error fetching users:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        try {
            await userAPI.create(userForm);
            setSuccess('Anggota berhasil didaftarkan!');
            setUserForm({ username: '', email: '', password: '', full_name: '', role: 'user' });
            fetchUsers();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 1200);
        } catch (err) { setError(err.response?.data?.error || 'Pendaftaran gagal'); }
    };

    const handleToggleStatus = async (user) => {
        try { await userAPI.update(user.id, { ...user, is_active: !user.is_active }); fetchUsers(); }
        catch { alert('Gagal mengubah status pengguna'); }
    };

    const handleToggleRole = async (user) => {
        if (user.id === currentUser.id) { alert("Anda tidak dapat mengubah peran Anda sendiri!"); return; }
        try { await userAPI.update(user.id, { ...user, role: user.role === 'admin' ? 'user' : 'admin' }); fetchUsers(); }
        catch { alert('Gagal memperbarui peran pengguna'); }
    };

    const handleResetPassword = async (userId) => {
        if (!window.confirm("Setel ulang kata sandi pengguna ini menjadi 'password123'?")) return;
        try { const res = await userAPI.resetPassword(userId); alert(`Kata sandi disetel ulang! Default: ${res.data.defaultPassword || 'password123'}`); }
        catch { alert('Gagal menyetel ulang kata sandi'); }
    };

    const handleDeleteUser = async (userId) => {
        if (userId === currentUser.id) { alert("Anda tidak dapat menghapus akun Anda sendiri!"); return; }
        if (!window.confirm("Hapus akun pengguna ini secara permanen?")) return;
        try { await userAPI.delete(userId); alert('Akun pengguna berhasil dihapus'); fetchUsers(); }
        catch { alert('Gagal menghapus pengguna'); }
    };

    const filteredUsers = users.filter((u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-space-lg space-y-space-lg max-w-7xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-space-md">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Manajemen Anggota</h2>
                        <p className="text-body-sm text-on-surface-variant">Kelola akun pengguna, peran keamanan, dan status otorisasi</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="bg-primary text-on-primary font-bold px-space-lg py-3 rounded-lg flex items-center gap-space-xs hover:brightness-110 active:scale-95 transition-all text-body-sm self-start">
                        <Icon name="person_add" size={20} /> Daftar Anggota Baru
                    </button>
                </div>

                <section className="bg-surface border border-outline-variant/30 rounded-2xl p-space-md space-y-space-md shadow-sm">
                    <div className="relative w-full w-[320px]">
                        <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                        <input type="text" placeholder="Cari berdasarkan nama, nama pengguna, email…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-container rounded-full py-2 pl-10 pr-4 text-body-sm text-on-surface border border-outline-variant/40 focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Icon name="sync" size={32} className="text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-body-sm text-on-surface-variant">
                                <thead>
                                    <tr className="border-b border-outline-variant/20 text-on-surface font-semibold">
                                        <th className="py-2">Detail Pengguna</th>
                                        <th className="py-2">Peran</th>
                                        <th className="py-2">Peminjaman Aktif</th>
                                        <th className="py-2">Status Akun</th>
                                        <th className="py-2 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-surface-container-high/40 transition-colors">
                                            <td className="py-2.5">
                                                <div className="flex items-center gap-space-sm">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}&background=facc15&color=1a1200&bold=true`} alt={u.full_name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-on-surface">{u.full_name}</p>
                                                        <p className="text-[11px] text-on-surface-variant">@{u.username} | {u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5">
                                                <button onClick={() => handleToggleRole(u)} className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors hover:brightness-110 active:scale-95 ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-secondary-container/50 text-secondary'}`}>
                                                    {u.role === 'admin' ? 'Admin' : 'User'}
                                                </button>
                                            </td>
                                            <td className="py-2.5 font-semibold text-on-surface">{u.active_loans || 0} aktif</td>
                                            <td className="py-2.5">
                                                <button onClick={() => handleToggleStatus(u)} className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors hover:brightness-110 active:scale-95 ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-error/20 text-error'}`}>
                                                    {u.is_active ? 'Aktif' : 'Ditangguhkan'}
                                                </button>
                                            </td>
                                            <td className="py-2.5 text-right space-x-space-sm">
                                                <button onClick={() => handleResetPassword(u.id)} className="text-primary-container hover:text-primary transition-colors text-xs font-bold" title="Setel Ulang Kata Sandi">
                                                    Setel Ulang Sandi
                                                </button>
                                                {u.id !== currentUser.id && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-error hover:text-red-400 transition-colors" title="Hapus Akun">
                                                        <Icon name="delete" size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-space-md">
                    <div className="bg-surface rounded-2xl border border-outline-variant/30 p-space-md w-[480px] w-full space-y-space-md shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-headline-md font-bold text-on-surface">Daftar Anggota Baru</h3>
                            <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface"><Icon name="close" size={22} /></button>
                        </div>
                        {error && <div className="bg-error-container/20 text-error p-2.5 rounded-lg text-body-sm border border-error/30">{error}</div>}
                        {success && <div className="bg-primary-container/20 text-primary p-2.5 rounded-lg text-body-sm border border-primary-container/30">{success}</div>}
                        <form onSubmit={handleRegisterSubmit} className="space-y-space-sm">
                            {[{ label: 'Nama Lengkap', key: 'full_name', type: 'text' }, { label: 'Nama Pengguna', key: 'username', type: 'text' }, { label: 'Email', key: 'email', type: 'email' }].map(({ label, key, type }) => (
                                <div key={key}>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">{label}</label>
                                    <input type={type} value={userForm[key]} onChange={(e) => setUserForm({ ...userForm, [key]: e.target.value })} required className={inputClass} />
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-space-sm">
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Kata Sandi</label>
                                    <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-label-md mb-1 text-on-surface-variant">Peran (Role)</label>
                                    <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className={inputClass}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:brightness-110 transition-all text-body-sm">Daftarkan Anggota</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
