import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from './Icon';

const SideNavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navItems = user?.role === 'admin'
        ? [
            { path: '/',              icon: 'menu_book',            label: 'Tampilan Perpustakaan' },
            { path: '/admin',         icon: 'dashboard',            label: 'Dashboard' },
            { path: '/admin/books',   icon: 'inventory_2',          label: 'Inventaris' },
            { path: '/admin/users',   icon: 'group',                label: 'Anggota' },
            { path: '/admin/reports', icon: 'analytics',            label: 'Laporan' },
            { path: '/settings',      icon: 'settings',             label: 'Pengaturan' },
          ]
        : [
            { path: '/',              icon: 'home',                 label: 'Beranda' },
             { path: '/catalog',       icon: 'library_books',        label: 'Katalog Buku' },
             { path: '/loans',         icon: 'collections_bookmark', label: 'Peminjaman' },
             { path: '/wishlist',      icon: 'favorite',             label: 'Favorit' },
             { path: '/history',       icon: 'history',              label: 'Riwayat' },
             { path: '/settings',      icon: 'settings',             label: 'Pengaturan' },
           ];


    const isActive = (path) => {
        // Exact match for root paths
        if (path === '/' || path === '/admin') {
            return location.pathname === path;
        }
        // Prefix match for sub-paths
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-[72px] h-[calc(100vh-64px)] fixed left-0 top-[64px] flex flex-col items-center py-md bg-surface z-30 print:hidden border-r border-outline-variant/10">
            {/* Nav items */}
            <nav className="flex flex-col gap-xs flex-1 w-full items-center">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={item.label}
                            aria-label={item.label}
                            className={`group relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${
                                active
                                    ? 'bg-primary text-on-primary'
                                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                            }`}
                        >
                            {/* Active left indicator */}
                            {active && (
                                <div className="absolute left-0 w-1 h-6 bg-primary" />
                            )}
                            <Icon name={item.icon} size={22} />
                            
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-[68px] px-2 py-1 bg-surface-container-highest text-on-surface text-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-outline-variant/30 z-60">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="w-full flex justify-center pb-md">
                <button
                    onClick={handleLogout}
                    title="Keluar"
                    aria-label="Keluar"
                    className="group relative w-12 h-12 flex items-center justify-center text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-all duration-200"
                >
                    <Icon name="logout" size={22} />
                    <span className="pointer-events-none absolute left-[68px] px-2 py-1 bg-surface-container-highest text-on-surface text-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-outline-variant/30 z-60">
                        Keluar
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default SideNavBar;
