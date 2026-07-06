import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Loans from './pages/Loans';
import Login from './pages/Login';
import Register from './pages/Register';
import BookDetail from './pages/BookDetail';
import Wishlist from './pages/Wishlist';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInventory from './pages/admin/AdminInventory';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminLoans from './pages/admin/AdminLoans';

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

            <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="catalog" element={<Catalog />} />
                <Route path="books/:id" element={<BookDetail />} />
                <Route path="loans" element={<Loans />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="history" element={<Loans />} />
                <Route path="settings" element={<Settings />} />

                {/* Admin Routes */}
                <Route path="admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
                <Route path="admin/books" element={user?.role === 'admin' ? <AdminInventory /> : <Navigate to="/" replace />} />
                <Route path="admin/loans" element={user?.role === 'admin' ? <AdminLoans /> : <Navigate to="/" replace />} />
                <Route path="admin/users" element={user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/" replace />} />
                <Route path="admin/reports" element={user?.role === 'admin' ? <AdminReports /> : <Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
