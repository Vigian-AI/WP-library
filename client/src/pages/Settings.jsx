import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../services/api';
import Icon from '../components/Icon';

const inputClass =
    'w-full bg-surface-container rounded-lg py-2.5 px-4 border border-outline-variant/40 text-sm text-on-surface focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors';

const Settings = () => {
    const { user, updateProfile, logout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [profileMsg, setProfileMsg]     = useState({ type: '', text: '' });
    const [passwordMsg, setPasswordMsg]   = useState({ type: '', text: '' });
    const [avatarMsg, setAvatarMsg]       = useState({ type: '', text: '' });
    const [loadingProfile, setLoadingProfile]   = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingAvatar, setLoadingAvatar]     = useState(false);
    const [avatarPreview, setAvatarPreview]     = useState(user?.avatar_url || null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const avatarInputRef = useRef(null);

    const initials = (user?.full_name || user?.username || 'U')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric',
          })
        : 'Tidak diketahui';

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarMsg({ type: '', text: '' });
        setLoadingAvatar(true);
        try {
            const response = await userAPI.uploadAvatar(user.id, file);
            updateProfile({ ...user, avatar_url: response.data.avatar_url });
            setAvatarPreview(response.data.avatar_url);
            setAvatarMsg({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
        } catch (error) {
            setAvatarPreview(user?.avatar_url || null);
            setAvatarMsg({ type: 'error', text: error.response?.data?.error || 'Gagal mengunggah foto' });
        } finally {
            setLoadingAvatar(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMsg({ type: '', text: '' });
        try {
            const response = await userAPI.update(user.id, profileData);
            updateProfile(response.data);
            setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui!' });
        } catch (error) {
            setProfileMsg({ type: 'error', text: error.response?.data?.error || 'Gagal memperbarui profil' });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Kata sandi baru tidak cocok' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Kata sandi minimal 6 karakter' });
            return;
        }
        setLoadingPassword(true);
        setPasswordMsg({ type: '', text: '' });
        try {
            await userAPI.changePassword(user.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMsg({ type: 'error', text: error.response?.data?.error || 'Gagal mengubah kata sandi' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== user?.username) {
            setDeleteError('Username tidak sesuai');
            return;
        }
        try {
            await userAPI.delete(user.id);
            logout();
            navigate('/login');
        } catch (error) {
            setDeleteError(error.response?.data?.error || 'Gagal menghapus akun');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-lg max-w-4xl mx-auto w-full space-y-8">

                {/* Header */}
                <div>
                    <h2 className="text-headline-lg text-on-surface">Pengaturan Akun</h2>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                        Kelola detail profil dan pengaturan keamanan Anda
                    </p>
                </div>

                {/* ── Kartu Info Akun ── */}
                <section className="bg-surface rounded-2xl border border-outline-variant/20 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

                        {/* Avatar + Tombol Ganti Foto */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center overflow-hidden shadow-md">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-on-primary">{initials}</span>
                                )}
                            </div>
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={loadingAvatar}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loadingAvatar ? (
                                    <>
                                        <Icon name="sync" size={13} className="text-primary animate-spin" />
                                        Mengunggah…
                                    </>
                                ) : (
                                    <>
                                        <Icon name="photo_camera" size={13} className="text-on-surface-variant" />
                                        Ganti Foto
                                    </>
                                )}
                            </button>

                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <h3 className="text-lg font-bold text-on-surface">{user?.full_name || user?.username}</h3>
                            <p className="text-sm text-on-surface-variant mt-0.5">{user?.email}</p>
                            {avatarMsg.text && (
                                <p className={`text-xs mt-1.5 font-medium ${avatarMsg.type === 'success' ? 'text-primary' : 'text-error'}`}>
                                    {avatarMsg.text}
                                </p>
                            )}
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                    user?.role === 'admin'
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-secondary/15 text-secondary'
                                }`}>
                                    <Icon name={user?.role === 'admin' ? 'shield' : 'person'} size={13} />
                                    {user?.role === 'admin' ? 'Administrator' : 'Anggota'}
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-on-surface-variant bg-surface-container">
                                    <Icon name="calendar_today" size={13} />
                                    Bergabung {joinDate}
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs text-on-surface-variant bg-surface-container">
                                    <Icon name="badge" size={13} />
                                    @{user?.username}
                                </span>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ── Form Profil & Kata Sandi ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Informasi Profil */}
                    <section className="bg-surface rounded-2xl border border-outline-variant/20 p-6 space-y-5 shadow-sm">
                        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                            <Icon name="person" size={20} className="text-primary" />
                            Informasi Profil
                        </h3>
                        {profileMsg.text && (
                            <div className={`p-3 rounded-lg text-sm border ${
                                profileMsg.type === 'success'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-error/10 text-error border-error/20'
                            }`}>
                                {profileMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={profileData.full_name}
                                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Alamat Email
                                </label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={user?.username || ''}
                                    disabled
                                    className={`${inputClass} opacity-50 cursor-not-allowed`}
                                />
                                <p className="text-xs text-on-surface-variant mt-1">Username tidak dapat diubah</p>
                            </div>
                            <button
                                type="submit"
                                disabled={loadingProfile}
                                className="w-full bg-primary text-on-primary text-sm font-semibold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loadingProfile ? 'Menyimpan…' : 'Simpan Profil'}
                            </button>
                        </form>
                    </section>

                    {/* Ubah Kata Sandi */}
                    <section className="bg-surface rounded-2xl border border-outline-variant/20 p-6 space-y-5 shadow-sm">
                        <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                            <Icon name="lock" size={20} className="text-primary" />
                            Ubah Kata Sandi
                        </h3>
                        {passwordMsg.text && (
                            <div className={`p-3 rounded-lg text-sm border ${
                                passwordMsg.type === 'success'
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-error/10 text-error border-error/20'
                            }`}>
                                {passwordMsg.text}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Kata Sandi Saat Ini
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Kata Sandi Baru
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    placeholder="Min. 6 karakter"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    placeholder="Ulangi kata sandi baru"
                                    className={inputClass}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loadingPassword}
                                className="w-full bg-primary text-on-primary text-sm font-semibold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loadingPassword ? 'Memperbarui…' : 'Perbarui Kata Sandi'}
                            </button>
                        </form>
                    </section>
                </div>

                {/* ── Preferensi Tampilan ── */}
                <section className="bg-surface rounded-2xl border border-outline-variant/20 p-6 space-y-4 shadow-sm">
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                        <Icon name="palette" size={20} className="text-primary" />
                        Preferensi Tampilan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon name="dark_mode" size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">Mode Gelap</p>
                                    <p className="text-xs text-on-surface-variant">Segera hadir</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-outline-variant/40 flex items-center px-1 cursor-not-allowed opacity-50">
                                <div className="w-4 h-4 rounded-full bg-surface shadow-sm" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon name="language" size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">Bahasa</p>
                                    <p className="text-xs text-on-surface-variant">Bahasa Indonesia</p>
                                </div>
                            </div>
                            <span className="text-xs text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded-md">ID</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon name="notifications" size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">Notifikasi Email</p>
                                    <p className="text-xs text-on-surface-variant">Pengingat jatuh tempo</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-primary flex items-center px-1 cursor-not-allowed opacity-60">
                                <div className="w-4 h-4 rounded-full bg-white shadow-sm ml-auto" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Icon name="visibility_off" size={18} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">Profil Privat</p>
                                    <p className="text-xs text-on-surface-variant">Segera hadir</p>
                                </div>
                            </div>
                            <div className="w-10 h-6 rounded-full bg-outline-variant/40 flex items-center px-1 cursor-not-allowed opacity-50">
                                <div className="w-4 h-4 rounded-full bg-surface shadow-sm" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Zona Bahaya ── */}
                <section className="bg-surface rounded-2xl border border-error/25 p-6 space-y-4 shadow-sm">
                    <h3 className="text-base font-bold text-error flex items-center gap-2">
                        <Icon name="warning" size={20} className="text-error" />
                        Zona Bahaya
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                        Tindakan di bagian ini bersifat permanen dan tidak dapat dibatalkan. Harap berhati-hati.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-all active:scale-95"
                        >
                            <Icon name="logout" size={16} />
                            Keluar dari Semua Perangkat
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-error/40 text-error text-sm font-semibold hover:bg-error/10 transition-all active:scale-95"
                        >
                            <Icon name="delete_forever" size={16} />
                            Hapus Akun Saya
                        </button>
                    </div>
                </section>

            </main>

            {/* ── Modal Konfirmasi Hapus Akun ── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl border border-outline-variant/30 p-6 w-full max-w-md space-y-5 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-error/10 flex-shrink-0">
                                <Icon name="warning" size={22} className="text-error" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-on-surface">Hapus Akun Secara Permanen</h3>
                                <p className="text-sm text-on-surface-variant mt-1">
                                    Semua data Anda termasuk riwayat peminjaman dan wishlist akan dihapus selamanya.
                                </p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">
                                Ketik <span className="text-error font-bold">{user?.username}</span> untuk konfirmasi
                            </label>
                            <input
                                type="text"
                                value={deleteInput}
                                onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(''); }}
                                placeholder={user?.username}
                                className={inputClass}
                            />
                            {deleteError && (
                                <p className="text-xs text-error mt-1">{deleteError}</p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                                className="flex-1 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface text-sm font-semibold hover:bg-surface-container transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteInput !== user?.username}
                                className="flex-1 py-2.5 rounded-lg bg-error text-white text-sm font-semibold hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Hapus Akun
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
