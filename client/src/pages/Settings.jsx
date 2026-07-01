import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../services/api';
import TopNavBar from '../components/TopNavBar';
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
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoadingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setLoadingPassword(true);
        setPasswordMessage({ type: '', text: '' });
        try {
            await userAPI.changePassword(user.id, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.response?.data?.error || 'Failed to change password' });
        } finally {
            setLoadingPassword(false);
        }
    };

    const inputClass = 'w-full bg-surface-container rounded-lg py-2.5 px-4 border border-outline-variant/40 text-body-sm text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <TopNavBar user={user} />
            <main className="flex-1 p-lg max-w-4xl mx-auto w-full space-y-xl">
                <div>
                    <h2 className="text-headline-lg text-on-surface">Account Settings</h2>
                    <p className="text-body-sm text-on-surface-variant">Manage your profile details and security settings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    {/* Profile */}
                    <section className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/20 space-y-md">
                        <h3 className="text-headline-md text-on-surface flex items-center gap-xs">
                            <Icon name="person" size={22} className="text-primary" />
                            Profile Information
                        </h3>
                        {profileMessage.text && (
                            <div className={`p-3 rounded-lg text-body-sm border ${profileMessage.type === 'success' ? 'bg-primary-container/20 text-primary border-primary-container/30' : 'bg-error-container/20 text-error border-error/30'}`}>
                                {profileMessage.text}
                            </div>
                        )}
                        <form onSubmit={handleProfileSubmit} className="space-y-sm">
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Full Name</label>
                                <input type="text" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Email Address</label>
                                <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} required className={inputClass} />
                            </div>
                            <button type="submit" disabled={loadingProfile} className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all text-body-sm disabled:opacity-50">
                                {loadingProfile ? 'Saving…' : 'Save Profile'}
                            </button>
                        </form>
                    </section>

                    {/* Password */}
                    <section className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/20 space-y-md">
                        <h3 className="text-headline-md text-on-surface flex items-center gap-xs">
                            <Icon name="lock" size={22} className="text-primary" />
                            Change Password
                        </h3>
                        {passwordMessage.text && (
                            <div className={`p-3 rounded-lg text-body-sm border ${passwordMessage.type === 'success' ? 'bg-primary-container/20 text-primary border-primary-container/30' : 'bg-error-container/20 text-error border-error/30'}`}>
                                {passwordMessage.text}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSubmit} className="space-y-sm">
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Current Password</label>
                                <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">New Password</label>
                                <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-body-sm font-semibold text-on-surface mb-1">Confirm New Password</label>
                                <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required className={inputClass} placeholder="••••••••" />
                            </div>
                            <button type="submit" disabled={loadingPassword} className="w-full bg-primary-container text-on-primary font-bold py-2.5 rounded-lg hover:brightness-105 active:scale-95 transition-all text-body-sm disabled:opacity-50">
                                {loadingPassword ? 'Updating…' : 'Update Password'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Settings;
