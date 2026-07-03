import { useEffect, useState } from 'react';
import api, { userAPI } from '../../services/api';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

const AdminReports = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ totalBooks: 0, activeLoans: 0, returnedLoans: 0, overdueLoans: 0, totalUsers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([api.get('/stats'), userAPI.getAll()]);
                setStats({
                    totalBooks:    statsRes.data.bookStats?.total_books || 0,
                    activeLoans:   statsRes.data.loanStats?.active_loans || 0,
                    returnedLoans: statsRes.data.loanStats?.returned_loans || 0,
                    overdueLoans:  statsRes.data.loanStats?.overdue_loans || 0,
                    totalUsers:    usersRes.data?.length || 0
                });
            } catch (err) { console.error('Error fetching reports stats:', err); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    const exportToCSV = (type) => {
        let csv = 'data:text/csv;charset=utf-8,';
        let filename = 'laporan.csv';
        if (type === 'summary') {
            csv += `Metrik,Nilai\nTotal Buku,${stats.totalBooks}\nPeminjaman Aktif,${stats.activeLoans}\nBuku Dikembalikan,${stats.returnedLoans}\nPeminjaman Terlambat,${stats.overdueLoans}\nTotal Anggota,${stats.totalUsers}\n`;
            filename = 'laporan_ringkasan_perpustakaan.csv';
        } else {
            csv += 'Bulan,Peminjaman,Pengembalian,Terlambat\nJanuari,45,40,2\nFebruari,60,52,4\nMaret,80,70,5\nApril,95,85,3\nMei,120,110,6\nJuni,156,132,12\n';
            filename = 'tren_peminjaman_perpustakaan.csv';
        }
        const a = document.createElement('a');
        a.href = encodeURI(csv); a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
    };

    const totalLoansEver = stats.activeLoans + stats.returnedLoans;
    const overdueRate = totalLoansEver > 0 ? ((stats.overdueLoans / totalLoansEver) * 100).toFixed(1) : 0;
    const returnRate  = totalLoansEver > 0 ? ((stats.returnedLoans / totalLoansEver) * 100).toFixed(1) : 0;

    const monthlyData = [
        { label: 'Jan', value: 45,  pct: 30 },
        { label: 'Feb', value: 60,  pct: 40 },
        { label: 'Mar', value: 80,  pct: 55 },
        { label: 'Apr', value: 95,  pct: 65 },
        { label: 'May', value: 120, pct: 80 },
        { label: 'Jun', value: 156, pct: 100 },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background print:bg-white print:text-black">
            <main className="flex-1 p-space-lg space-y-space-lg max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center print:hidden">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Laporan & Analitik</h2>
                        <p className="text-body-sm text-on-surface-variant">Analisis kinerja perpustakaan, tingkat peminjaman, dan unduh laporan</p>
                    </div>
                    <div className="flex gap-space-sm">
                        <button onClick={() => window.print()} className="bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high px-space-lg py-2.5 rounded-lg flex items-center gap-space-xs active:scale-95 transition-all text-body-sm">
                            <Icon name="print" size={18} /> Cetak PDF
                        </button>
                        <button onClick={() => exportToCSV('summary')} className="bg-primary text-on-primary font-bold px-space-lg py-2.5 rounded-lg flex items-center gap-space-xs hover:brightness-110 active:scale-95 transition-all text-body-sm">
                            <Icon name="download" size={18} /> Ekspor CSV
                        </button>
                    </div>
                </div>

                {/* Print header */}
                <div className="hidden print:block text-center space-y-space-xs pb-space-lg border-b border-gray-300">
                    <h1 className="text-3xl font-bold">Laporan Sistem Perpustakaan</h1>
                    <p className="text-sm text-gray-600">Dibuat pada {new Date().toLocaleDateString()} | {user?.full_name}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12 print:hidden">
                        <Icon name="sync" size={32} className="text-primary animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Summary metrics */}
                        <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
                            {[
                                { label: 'Tingkat Pengembalian',     value: `${returnRate}%`,      color: 'text-primary',           note: 'Dari total transaksi peminjaman' },
                                { label: 'Tingkat Keterlambatan',    value: `${overdueRate}%`,     color: 'text-error',             note: 'Belum dikembalikan lewat batas waktu' },
                                { label: 'Total Peminjaman',     value: totalLoansEver,        color: 'text-secondary',         note: 'Catatan historis' },
                                { label: 'Anggota Aktif',  value: stats.totalUsers,      color: 'text-primary-container', note: 'Terdaftar dalam database' },
                            ].map(({ label, value, color, note }) => (
                                <div key={label} className="bg-surface p-space-md rounded-xl border border-outline-variant/30 print:border-gray-300 print:bg-white text-center space-y-space-xs shadow-sm">
                                    <p className="text-label-md text-on-surface-variant uppercase tracking-wider print:text-gray-600">{label}</p>
                                    <p className={`text-headline-xl font-bold ${color}`}>{value}</p>
                                    <p className="text-[11px] text-on-surface-variant print:text-gray-500">{note}</p>
                                </div>
                            ))}
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                            {/* Bar chart */}
                            <div className="lg:col-span-8 bg-surface border border-outline-variant/30 rounded-2xl p-space-md space-y-space-md shadow-sm">
                                <div className="flex justify-between items-center print:hidden">
                                    <h3 className="text-headline-md text-on-surface flex items-center gap-space-xs font-bold">
                                        <Icon name="analytics" size={20} className="text-primary" />
                                        Tren Peminjaman Bulanan (2026)
                                    </h3>
                                    <button onClick={() => exportToCSV('trends')} className="text-primary-container hover:underline text-label-md flex items-center gap-space-xs font-bold">
                                        Ekspor Data Grafik
                                    </button>
                                </div>
                                <h3 className="hidden print:block text-lg font-bold">Tren Peminjaman Bulanan</h3>

                                <div className="flex h-64 items-end gap-space-md pt-space-lg border-b border-outline-variant/20 pb-2">
                                    {monthlyData.map(({ label, value, pct }, i) => (
                                        <div key={label} className="flex-1 flex flex-col items-center h-full justify-end group">
                                            <span className="text-[10px] text-on-surface-variant group-hover:text-primary mb-1">{value}</span>
                                            <div
                                                className={`w-full rounded-t-md transition-all duration-300 ${i === monthlyData.length - 1 ? 'bg-primary-container' : 'bg-primary/40 hover:bg-primary'}`}
                                                style={{ height: `${pct}%` }}
                                            />
                                            <span className={`text-[10px] mt-2 ${i === monthlyData.length - 1 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Analytics breakdown */}
                            <div className="lg:col-span-4 bg-surface border border-outline-variant/30 rounded-2xl p-space-md space-y-space-md shadow-sm">
                                <h3 className="text-headline-md text-on-surface font-bold">Rincian Analitik</h3>
                                <div className="space-y-space-sm">
                                    {[
                                        { label: 'Peminjaman Dikembalikan', detail: `${stats.returnedLoans} dari ${totalLoansEver}`, pct: returnRate, color: 'bg-primary' },
                                        { label: 'Pengembalian Terlambat',     detail: `${stats.overdueLoans} kasus`,                  pct: overdueRate, color: 'bg-error' },
                                    ].map(({ label, detail, pct, color }) => (
                                        <div key={label} className="space-y-space-xs">
                                            <div className="flex justify-between text-body-sm">
                                                <span className="text-on-surface-variant">{label}</span>
                                                <span className="text-on-surface font-semibold">{detail}</span>
                                            </div>
                                            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                                                <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="space-y-space-xs pt-space-xs border-t border-outline-variant/10">
                                        <div className="flex justify-between text-[11px] text-on-surface-variant">
                                            <span>Denda Terkumpul (est.):</span>
                                            <span className="font-semibold text-primary">${(stats.overdueLoans * 0.5 * 14).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-on-surface-variant">
                                            <span>Periode Default:</span>
                                            <span className="font-semibold text-on-surface">14 Hari</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminReports;
