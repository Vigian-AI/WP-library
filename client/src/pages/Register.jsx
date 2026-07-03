import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', full_name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.register(formData);
            login(response.data.user, response.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full bg-surface-container rounded-lg py-2.5 px-4 text-body-md text-on-surface focus:border-primary-container/60 focus:outline-none focus:ring-1 focus:ring-primary-container/60 transition-colors';

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-space-lg py-12">
            <div className="w-full mw-form-sm">
                <div className="bg-surface rounded-2xl p-space-lg border border-outline-variant/30 shadow-2xl space-y-space-md">
                    <div className="text-center space-y-space-xs">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-container/20 mb-1">
                            <Icon name="menu_book" size={32} className="text-primary-container" />
                        </div>
                        <h1 className="text-headline-lg text-on-surface">Buat akun</h1>
                        <p className="text-body-sm text-on-surface-variant">Bergabunglah dengan Perpustakaan Digital sekarang</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-error-container/30 text-error text-body-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Nama Lengkap</label>
                            <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required autoComplete="name" className={inputClass} placeholder="Nama lengkap Anda" />
                        </div>
                        <div>
                            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Nama pengguna</label>
                            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required autoComplete="username" className={inputClass} placeholder="Pilih nama pengguna" />
                        </div>
                        <div>
                            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Alamat email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required autoComplete="email" className={inputClass} placeholder="anda@contoh.com" />
                        </div>
                        <div>
                            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Kata sandi</label>
                            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required autoComplete="new-password" className={inputClass} placeholder="Buat kata sandi yang kuat" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-body-md mt-2"
                        >
                            {loading ? 'Membuat akun…' : 'Daftar'}
                        </button>

                        <p className="text-center text-body-sm text-on-surface-variant pt-1">
                            Sudah punya akun?{' '}
                            <Link to="/login" className="text-primary font-semibold hover:underline">Masuk</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
