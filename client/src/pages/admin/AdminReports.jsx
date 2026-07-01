import { useEffect, useState } from 'react';
import api, { userAPI } from '../../services/api';
import TopNavBar from '../../components/TopNavBar';
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
        let filename = 'report.csv';
        if (type === 'summary') {
            csv += `Metric,Value\nTotal Books,${stats.totalBooks}\nActive Loans,${stats.activeLoans}\nReturned Loans,${stats.returnedLoans}\nOverdue Loans,${stats.overdueLoans}\nTotal Members,${stats.totalUsers}\n`;
            filename = 'library_summary_report.csv';
        } else {
            csv += 'Month,Borrowings,Returns,Overdues\nJanuary,45,40,2\nFebruary,60,52,4\nMarch,80,70,5\nApril,95,85,3\nMay,120,110,6\nJune,156,132,12\n';
            filename = 'library_loan_trends.csv';
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
            <div className="print:hidden"><TopNavBar user={user} /></div>

            <main className="flex-1 p-lg space-y-lg max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-center print:hidden">
                    <div>
                        <h2 className="text-headline-lg text-on-surface">Reports & Analytics</h2>
                        <p className="text-body-sm text-on-surface-variant">Analyze library performance, loan rates, and download reports</p>
                    </div>
                    <div className="flex gap-sm">
                        <button onClick={() => window.print()} className="bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high px-lg py-2.5 rounded-lg flex items-center gap-xs active:scale-95 transition-all text-body-sm">
                            <Icon name="print" size={18} /> Print PDF
                        </button>
                        <button onClick={() => exportToCSV('summary')} className="bg-primary-container text-on-primary font-bold px-lg py-2.5 rounded-lg flex items-center gap-xs hover:brightness-110 active:scale-95 transition-all text-body-sm">
                            <Icon name="download" size={18} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Print header */}
                <div className="hidden print:block text-center space-y-xs pb-lg border-b border-gray-300">
                    <h1 className="text-3xl font-bold">Library System Report</h1>
                    <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()} | {user?.full_name}</p>
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
                                { label: 'Return Rate',     value: `${returnRate}%`,      color: 'text-primary',           note: 'Of total loan transactions' },
                                { label: 'Overdue Rate',    value: `${overdueRate}%`,     color: 'text-error',             note: 'Unreturned past due date' },
                                { label: 'Total Loans',     value: totalLoansEver,        color: 'text-secondary',         note: 'Historical records' },
                                { label: 'Active Members',  value: stats.totalUsers,      color: 'text-primary-container', note: 'Registered in database' },
                            ].map(({ label, value, color, note }) => (
                                <div key={label} className="bg-surface-container-low p-md rounded-xl border border-outline-variant/10 print:border-gray-300 print:bg-white text-center space-y-xs">
                                    <p className="text-label-md text-on-surface-variant uppercase tracking-wider print:text-gray-600">{label}</p>
                                    <p className={`text-headline-xl font-bold ${color}`}>{value}</p>
                                    <p className="text-[11px] text-on-surface-variant print:text-gray-500">{note}</p>
                                </div>
                            ))}
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                            {/* Bar chart */}
                            <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md space-y-md">
                                <div className="flex justify-between items-center print:hidden">
                                    <h3 className="text-headline-md text-on-surface flex items-center gap-xs">
                                        <Icon name="analytics" size={20} className="text-primary" />
                                        Monthly Loan Trends (2026)
                                    </h3>
                                    <button onClick={() => exportToCSV('trends')} className="text-primary-container hover:underline text-label-md flex items-center gap-xs">
                                        Export Chart Data
                                    </button>
                                </div>
                                <h3 className="hidden print:block text-lg font-bold">Monthly Loan Trends</h3>

                                <div className="flex h-64 items-end gap-md pt-lg border-b border-outline-variant/20 pb-2">
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
                            <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md space-y-md">
                                <h3 className="text-headline-md text-on-surface">Analytics Breakdown</h3>
                                <div className="space-y-sm">
                                    {[
                                        { label: 'Borrowings Returned', detail: `${stats.returnedLoans} of ${totalLoansEver}`, pct: returnRate, color: 'bg-primary' },
                                        { label: 'Overdue Returns',     detail: `${stats.overdueLoans} cases`,                  pct: overdueRate, color: 'bg-error' },
                                    ].map(({ label, detail, pct, color }) => (
                                        <div key={label} className="space-y-xs">
                                            <div className="flex justify-between text-body-sm">
                                                <span className="text-on-surface-variant">{label}</span>
                                                <span className="text-on-surface font-semibold">{detail}</span>
                                            </div>
                                            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                                                <div className={`${color} h-full`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="space-y-xs pt-xs border-t border-outline-variant/10">
                                        <div className="flex justify-between text-[11px] text-on-surface-variant">
                                            <span>Fine Collected (est.):</span>
                                            <span className="font-semibold text-primary">${(stats.overdueLoans * 0.5 * 14).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-on-surface-variant">
                                            <span>Default Period:</span>
                                            <span className="font-semibold text-on-surface">14 Days</span>
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
