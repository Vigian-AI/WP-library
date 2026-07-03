import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../services/api';
import Icon from '../components/Icon';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const [profileData, setProfileData] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoadingProfile(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const response = await userAPI.update(user.id, profileData);
            updateProfile(response.data);
            setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.response?.data?.error || 'Gagal memperbarui profil' });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Kata sandi baru tidak cocok' });
            return;
        }
        setLoadingPassword(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await userAPI.changePassword(user.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.response?.data?.error || 'Gagal mengubah kata sandi' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const inputClass = 'w-full bg-surface-container rounded-lg py-2.5 px-4 border border-outline-variant/40 text-body-sm text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 p-space-lg max-w-4xl mx-auto w-full space-y-space-xl">
                <div>
                    <h2 className="text-headline-lg text-on-surface">Pengaturan Akun</h2>
                    <p className="text-body-sm text-on-surface-variant">Kelola detail profil dan pengaturan keamanan Anda</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                    {/* Profile */}
                    <section className="bg-surface rounded-2xl p-space-md border border-outline-variant/20 space-y-space-md shadow-sm">
                        <h3 className="text-headline-md text-on-surface flex items-center gap-space-xs">
                            <Icon name="person" size={22} className="text-primary" />
                            Informasi Profil
                        </h3>
                        {profileMessage.text && (
                            <div className={`p-3 rounded-lg text-body-sm border ${profileMessage.type === 'success' ? 'bg-primary-container/20 text-primary border-primary-container/30' : 'bg-error-container/20 text-error border-error/30'}`}>
                                {profileMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleProfileSubmit} className="space-y-space-sm">
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Nama Lengkap</label>
                                <input type="text" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Alamat Email</label>
                                <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} required className={inputClass} />
                            </div>
                            <button type="submit" disabled={loadingProfile} className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all text-body-sm disabled:opacity-50">
                                {loadingProfile ? 'Menyimpan…' : 'Simpan Profil'}
                            </button>
                        </form>
                    </section>

                    {/* Password */}
                    <section className="bg-surface rounded-2xl p-space-md border border-outline-variant/20 space-y-space-md shadow-sm">
                        <h3 className="text-headline-md text-on-surface flex items-center gap-space-xs">
                            <Icon name="lock" size={22} className="text-primary" />
                            Ubah Kata Sandi
                        </h3>
                        {passwordMessage.text && (
                            <div className={`p-3 rounded-lg text-body-sm border ${passwordMessage.type === 'success' ? 'bg-primary-container/20 text-primary border-primary-container/30' : 'bg-error-container/20 text-error border-error/30'}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSubmit} className="space-y-space-sm">
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Kata Sandi Saat Ini</label>
                                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Kata Sandi Baru</label>
                                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Konfirmasi Kata Sandi Baru</label>
                                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <button type="submit" disabled={loadingPassword} className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all text-body-sm disabled:opacity-50">
                                {loadingPassword ? 'Memperbarui…' : 'Perbarui Kata Sandi'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Settings;
