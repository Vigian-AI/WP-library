import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';
import Icon from './Icon';

const Layout = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Icon name="sync" size={48} className="text-primary animate-spin" />
                    <p className="text-on-surface mt-2">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background text-on-surface">
            {/* TopNavBar — full width di paling atas */}
            {user && <TopNavBar user={user} />}

            {/* Sidebar + Content di bawah navbar */}
            <div className="flex">
                {user && <SideNavBar />}
                <main className={`flex-1 ${user ? 'ml-[72px] print:ml-0' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
