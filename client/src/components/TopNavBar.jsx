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
        <header className="h-[64px] sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md flex items-center px-lg gap-lg border-b border-outline-variant/10">
            {/* Logo */}
            <div
                className="flex items-center gap-xs cursor-pointer flex-shrink-0"
                onClick={() => navigate('/')}
            >
                <Icon name="menu_book" size={24} className="text-primary" />
                <h1 className="text-headline-md font-bold text-on-surface hidden sm:block">
                    Library
                </h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-xs h-full">
                {[
                    { label: 'Library', path: '/' },
                    { label: 'Books', path: '/catalog' },
                ].map((tab) => (
                    <Link
                        key={tab.label}
                        to={tab.path}
                        className={`px-4 py-2 text-sm font-semibold transition-all ${
                            location.pathname === tab.path
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                        }`}
                    >
                        {tab.label}
                    </Link>
                ))}

            </nav>

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
                    placeholder="Search by book name, author, categories..."
                />
            </form>

            {/* Right: notification bell + profile */}
            <div className="flex items-center gap-sm ml-auto">
                <button
                    className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                    title="Notifications"
                >
                    <Icon name="notifications" size={22} />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-xs hover:bg-surface-container-high px-2 py-1 transition-all"
                    >
                        <div className="w-8 h-8 overflow-hidden bg-surface-container-high">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'G')}&background=bfdbfe&color=020617&bold=true&size=36`}
                                alt={user?.full_name || 'Guest'}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="hidden sm:block text-body-sm font-semibold text-on-surface">
                            {user?.full_name || 'Guest'}
                        </span>
                        <Icon name="expand_more" size={18} className="text-on-surface-variant" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 top-12 w-52 bg-surface-container-high p-xs shadow-xl z-50 border border-outline-variant/10">
                            <div className="px-sm py-xs mb-xs">
                                <p className="text-body-sm font-bold text-on-surface truncate">{user?.full_name}</p>
                                <p className="text-label-md text-on-surface-variant truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                                className="w-full text-left px-sm py-2 hover:bg-surface-container-highest text-body-sm flex items-center gap-xs text-on-surface transition-colors"
                            >
                                <Icon name="settings" size={18} className="text-on-surface-variant" />
                                Settings
                            </button>
                            <button
                                onClick={() => { logout(); setShowDropdown(false); navigate('/login'); }}
                                className="w-full text-left px-sm py-2 hover:bg-error-container/20 hover:text-error text-body-sm flex items-center gap-xs text-on-surface transition-colors"
                            >
                                <Icon name="logout" size={18} className="text-on-surface-variant" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );

};

export default TopNavBar;
