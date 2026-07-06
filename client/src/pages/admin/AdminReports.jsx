import { useEffect, useState } from 'react';
import api, { userAPI, loanAPI } from '../../services/api';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

const AdminReports = () => {
    const { user } = useAuth();
    const [stats, setStats]           = useState({ totalBooks: 0, activeLoans: 0, returnedLoans: 0, overdueLoans: 0, totalUsers: 0, totalUnpaidFines: 0, totalCollectedFines: 0 });
    const [overdueLoans, setOverdueLoans] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [exportFilter, setExportFilter] = useState({ status: '', from: '', to: '' });
    const [toast, setToast]           = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [statsRes, usersRes, overdueRes] = await Promise.all([
                    api.get('/stats'),
                    userAPI.getAll(),
                    loanAPI.getOverdue(),
                ]);
                const ls = statsRes.data.loanStats || {};
                setStats({
                    totalBooks:           statsRes.data.bookStats?.total_books || 0,
                    activeLoans:          ls.active_loans || 0,
                    returnedLoans:        ls.returned_loans || 0,
                    overdueLoans:         ls.overdue_loans || 0,
                    totalUsers:           usersRes.data?.length || 0,
                    totalUnpaidFines:     parseFloat(ls.total_unpaid_fines || 0),
                    totalCollectedFines:  parseFloat(ls.total_collected_fines || 0),
                });
                setOverdueLoans(overdueRes.data || []);
            } catch (err) {
                console.error('Error fetching reports:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const handleSendReminders = async () => {
        setReminderLoading(true);
        try {
            const res = await loanAPI.sendReminders();
            showToast(res.data?.message || 'Reminder terkirim', 'success');
        } catch {
            showToast('Gagal mengirim reminder', 'error');
        } finally {
            setReminderLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await loanAPI.export(exportFilter);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `laporan_peminjaman_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast('Export berhasil diunduh', 'success');
        } catch {
            showToast('Gagal mengekspor data', 'error');
        }
    };

    const handlePrint = () => window.print();

    const totalLoansEver = stats.activeLoans + stats.returnedLoans;
    const overdueRate    = totalLoansEver > 0 ? ((stats.overdueLoans / totalLoansEver) * 100).toFixed(1) : 0;
    const returnRate     = totalLoansEver > 0 ? ((stats.returnedLoans / totalLoansEver) * 100).toFixed(1) : 0;

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <div className="min-h-screen flex flex-col bg-background print:bg-white">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                    toast.type === 'success' ? 'bg-primary text-on-primary' : 'bg-error text-white'
                }`}>
                    <Icon name={toast.type === 'success' ? 'check_circle' : 'error'} size={18} />
                    {toast.message}
                </div>
            )}

            <main className="flex-1 p-space-lg space-y-space-lg max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-space-sm print:hidden">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Laporan & Analitik</h2>
                        <p className="text-body-sm text-on-surface-variant">Analisis kinerja perpustakaan dan unduh laporan</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleSendReminders}
                            disabled={reminderLoading}
                            className="bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-lg flex items-center gap-2 text-body-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
                        >
                            <Icon name={reminderLoading ? 'sync' : 'notifications'} size={18} className={reminderLoading ? 'animate-spin' : ''} />
                            Kirim Reminder
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high px-4 py-2.5 rounded-lg flex items-center gap-2 text-body-sm font-semibold transition-all active:scale-95"
                        >
                            <Icon name="print" size={18} /> Cetak PDF
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all text-body-sm"
                        >
                            <Icon name="download" size={18} /> Ekspor CSV
                        </button>
                    </div>
                </div>

                {/* Print header */}
                <div className="hidden print:block text-center space-y-1 pb-4 border-b border-gray-300">
                    <h1 className="text-3xl font-bold">Laporan Sistem Perpustakaan</h1>
                    <p className="text-sm text-gray-500">Dicetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | {user?.full_name}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12 print:hidden">
                        <Icon name="sync" size={32} className="text-primary animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Metrik Utama */}
                        <section className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
                            {[
                                { label: 'Tingkat Pengembalian', value: `${returnRate}%`,  color: 'text-primary',   note: 'Dari total transaksi' },
                                { label: 'Tingkat Keterlambatan', value: `${overdueRate}%`, color: 'text-error',     note: 'Belum dikembalikan tepat waktu' },
                                { label: 'Total Peminjaman',      value: totalLoansEver,   color: 'text-secondary', note: 'Catatan historis' },
                                { label: 'Anggota Terdaftar',     value: stats.totalUsers, color: 'text-secondary', note: 'Dalam database' },
                            ].map(({ label, value, color, note }) => (
                                <div key={label} className="bg-surface p-space-md rounded-xl border border-outline-variant/30 text-center space-y-1 shadow-sm print:border-gray-300">
                                    <p className="text-label-md text-on-surface-variant uppercase tracking-wider">{label}</p>
                                    <p className={`text-headline-xl font-bold ${color}`}>{value}</p>
                                    <p className="text-[11px] text-on-surface-variant">{note}</p>
                                </div>
                            ))}
                        </section>

                        {/* Denda */}
                        <section className="grid grid-cols-2 gap-gutter">
                            <div className="bg-surface p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                                    <Icon name="payments" size={20} className="text-error" />
                                </div>
                                <div>
                                    <p className="text-label-md text-on-surface-variant">Denda Belum Dibayar</p>
                                    <p className="text-headline-md font-bold text-error">${stats.totalUnpaidFines.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="bg-surface p-space-md rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Icon name="check_circle" size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-label-md text-on-surface-variant">Denda Terkumpul</p>
                                    <p className="text-headline-md font-bold text-primary">${stats.totalCollectedFines.toFixed(2)}</p>
                                </div>
                            </div>
                        </section>

                        {/* Analytics breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                            {/* Daftar Overdue */}
                            <div className="lg:col-span-8 bg-surface border border-outline-variant/30 rounded-2xl p-space-md shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-headline-md text-on-surface font-bold flex items-center gap-2">
                                        <Icon name="warning" size={20} className="text-error" />
                                        Peminjaman Terlambat ({overdueLoans.length})
                                    </h3>
                                </div>
                                {overdueLoans.length === 0 ? (
                                    <div className="py-8 text-center text-on-surface-variant text-body-sm">
                                        <Icon name="check_circle" size={32} className="mx-auto mb-2 text-primary/40" />
                                        Tidak ada peminjaman terlambat
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                        {overdueLoans.map(loan => (
                                            <div key={loan.id} className="flex items-center gap-3 p-3 bg-error/5 rounded-lg border border-error/20">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-body-sm font-semibold text-on-surface truncate">{loan.title}</p>
                                                    <p className="text-[11px] text-on-surface-variant">{loan.full_name} (@{loan.username})</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-bold text-error">{loan.overdue_days} hari</p>
                                                    <p className="text-[11px] text-error/70">${parseFloat(loan.fine_amount || 0).toFixed(2)}</p>
                                                </div>
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="text-[11px] text-on-surface-variant">Jatuh Tempo</p>
                                                    <p className="text-xs font-semibold text-on-surface">{formatDate(loan.due_date)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Panel Kanan */}
                            <div className="lg:col-span-4 space-y-space-md">
                                {/* Analytics */}
                                <div className="bg-surface border border-outline-variant/30 rounded-2xl p-space-md shadow-sm">
                                    <h3 className="text-headline-md text-on-surface font-bold mb-4">Rincian Analitik</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Dikembalikan', detail: `${stats.returnedLoans} dari ${totalLoansEver}`, pct: returnRate, color: 'bg-primary' },
                                            { label: 'Terlambat',     detail: `${stats.overdueLoans} kasus`,                  pct: overdueRate, color: 'bg-error' },
                                        ].map(({ label, detail, pct, color }) => (
                                            <div key={label} className="space-y-1">
                                                <div className="flex justify-between text-body-sm">
                                                    <span className="text-on-surface-variant">{label}</span>
                                                    <span className="font-semibold text-on-surface">{detail}</span>
                                                </div>
                                                <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                                                    <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Export Filter */}
                                <div className="bg-surface border border-outline-variant/30 rounded-2xl p-space-md shadow-sm print:hidden">
                                    <h3 className="text-headline-md text-on-surface font-bold mb-3 flex items-center gap-2">
                                        <Icon name="filter_alt" size={18} className="text-primary" />
                                        Filter Export CSV
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-label-md text-on-surface-variant">Status</label>
                                            <select
                                                value={exportFilter.status}
                                                onChange={e => setExportFilter(p => ({ ...p, status: e.target.value }))}
                                                className="w-full mt-1 text-body-sm bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                                            >
                                                <option value="">Semua Status</option>
                                                <option value="active">Aktif</option>
                                                <option value="returned">Dikembalikan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-label-md text-on-surface-variant">Dari Tanggal</label>
                                            <input
                                                type="date"
                                                value={exportFilter.from}
                                                onChange={e => setExportFilter(p => ({ ...p, from: e.target.value }))}
                                                className="w-full mt-1 text-body-sm bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-label-md text-on-surface-variant">Sampai Tanggal</label>
                                            <input
                                                type="date"
                                                value={exportFilter.to}
                                                onChange={e => setExportFilter(p => ({ ...p, to: e.target.value }))}
                                                className="w-full mt-1 text-body-sm bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <button
                                            onClick={handleExport}
                                            className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all text-body-sm"
                                        >
                                            <Icon name="download" size={18} /> Download CSV
                                        </button>
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
