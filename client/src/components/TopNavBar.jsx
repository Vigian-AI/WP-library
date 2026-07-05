import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';

const TopNavBar = ({ user, onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        } else {
            navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header 
            className={`h-[64px] sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md flex items-center pr-lg gap-md border-b border-outline-variant/10 ${user ? 'pl-[80px]' : 'pl-lg'}`}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-xs cursor-pointer flex-shrink-0"
                onClick={() => navigate('/')}
            >
                <Icon name="menu_book" size={24} className="text-primary" />
                <h1 className="text-headline-md font-bold text-on-surface hidden sm:block">
                    Perpustakaan
                </h1>
            </div>


            {/* Search bar */}
            <form
                onSubmit={handleSubmit}
                className="relative flex-1 max-w-[600px] hidden md:block mx-auto"
            >
                <Icon
                    name="search"
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container h-[42px] pl-10 pr-4 text-body-sm text-on-surface border border-outline-variant/30 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-colors placeholder:text-outline"
                    placeholder="Cari berdasarkan judul, penulis, atau kategori..."
                />
            </form>

            {/* Right: notification bell + profile */}
            <div className="flex items-center gap-sm ml-auto">
                <button
                    className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    title="Notifikasi"
                >
                    <Icon name="notifications" size={22} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-xs hover:bg-surface-container-high px-2 py-1 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary flex items-center justify-center flex-shrink-0">
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user?.full_name || 'User'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-on-primary">
                                    {(user?.full_name || user?.username || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                                </span>
                            )}
                        </div>
                        <span className="hidden sm:block text-body-sm font-semibold text-on-surface">
                            {user?.full_name || 'Tamu'}
                        </span>
                        <Icon name="expand_more" size={18} className="text-on-surface-variant" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-14 w-72 bg-surface rounded-2xl shadow-2xl z-50 border border-outline-variant/20 overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-surface-container px-space-md py-space-md flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30 shadow-md mb-2 bg-primary flex items-center justify-center">
                                    {user?.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user?.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-2xl font-bold text-on-primary">
                                            {(user?.full_name || user?.username || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-body-sm font-bold text-on-surface truncate w-full">{user?.full_name}</p>
                                <p className="text-label-md text-on-surface-variant truncate w-full">{user?.email}</p>
                                {user?.role && (
                                    <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${user.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary'}`}>
                                        {user.role}
                                    </span>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <button
                                    onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-container text-body-sm flex items-center gap-space-xs text-on-surface transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                                        <Icon name="settings" size={18} className="text-on-surface-variant" />
                                    </div>
                                    <div>
                                        <span className="font-semibold">Pengaturan</span>
                                        <p className="text-[11px] text-on-surface-variant leading-tight">Preferensi akun</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { logout(); setShowDropdown(false); navigate('/login'); }}
                                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-error-container/20 text-body-sm flex items-center gap-space-xs text-on-surface transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-surface-container group-hover:bg-error/10 flex items-center justify-center transition-colors">
                                        <Icon name="logout" size={18} className="text-on-surface-variant group-hover:text-error transition-colors" />
                                    </div>
                                    <div>
                                        <span className="font-semibold group-hover:text-error transition-colors">Keluar</span>
                                        <p className="text-[11px] text-on-surface-variant leading-tight">Keluar dari akun Anda</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );

};

export default TopNavBar;
