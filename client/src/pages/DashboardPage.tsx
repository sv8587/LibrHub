import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  FileSpreadsheet,
  Sparkles,
  BookMarked,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ReturnModal } from '../components/ReturnModal';
import { dashboardApi } from '../services/api';
import { DashboardData } from '../types';
import { BookCover } from '../components/BookCover';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext<any>() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returnTargetBookId, setReturnTargetBookId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardApi.getStats();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-xs text-slate-500 font-medium">Loading library analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalBooks: 0,
    totalPhysicalCopies: 0,
    availableBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
  };

  const currentlyIssued = data?.currentlyIssuedList || [];
  const charts = data?.charts || {
    booksByCategory: [],
    issueVsReturn: [],
    mostBorrowedBooks: [],
    mostBorrowedCategories: [],
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Library Operations Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              Live System
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog inventory, circulating loans, overdue tracking, and circulation analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-action-add-book"
            onClick={outletContext.openAddBook}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>

          <button
            id="dash-action-scan-qr"
            onClick={() => navigate('/scan')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            Scan QR
          </button>

          <button
            id="dash-action-issue"
            onClick={() => outletContext.openIssue()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors"
          >
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
            Issue Book
          </button>

          <button
            id="dash-action-return"
            onClick={() => outletContext.openReturn()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            Return Book
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards in Sleek 4-column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          id="stat-card-total-books"
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          subtitle={`${stats.totalPhysicalCopies} total physical copies`}
          trend="12% from last month"
          icon={BookOpen}
          colorScheme="indigo"
          onClick={() => navigate('/books')}
        />

        <StatCard
          id="stat-card-available-books"
          title="Available"
          value={stats.availableBooks.toLocaleString()}
          subtitle={`${
            stats.totalPhysicalCopies > 0
              ? Math.round((stats.availableBooks / stats.totalPhysicalCopies) * 100)
              : 0
          }% inventory in-house`}
          icon={CheckCircle2}
          colorScheme="emerald"
          onClick={() => navigate('/books?availability=available')}
        />

        <StatCard
          id="stat-card-issued-books"
          title="Issued"
          value={stats.issuedBooks.toLocaleString()}
          subtitle="Active student loans"
          icon={Clock}
          colorScheme="blue"
          onClick={() => navigate('/transactions?status=ISSUED')}
        />

        <StatCard
          id="stat-card-overdue-books"
          title="Overdue"
          value={stats.overdueBooks.toLocaleString()}
          subtitle={
            stats.overdueBooks > 0 ? 'Requires attention' : 'All loans on schedule'
          }
          icon={AlertTriangle}
          colorScheme="rose"
          onClick={() => navigate('/transactions?status=OVERDUE')}
        />
      </div>

      {/* Main 12-Column Sleek Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Currently Issued Books & Overdue Monitor Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Active Loans & Overdue Monitor</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Currently issued inventory with scheduled return deadlines
                </p>
              </div>
              <button
                onClick={() => navigate('/transactions?status=ISSUED')}
                className="text-teal-600 text-xs font-bold hover:underline"
              >
                View All Loans ({currentlyIssued.length})
              </button>
            </div>

            {currentlyIssued.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No books are currently issued. All copies are available on the shelves!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                      <th className="px-6 py-3">Book Details</th>
                      <th className="px-6 py-3">Borrower</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentlyIssued.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#1b2740] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <BookCover isbn={item.bookIsbn} title={item.bookTitle} className="w-9 h-12 rounded-md shrink-0 shadow-sm" />
                            <div>
                          <p className="text-sm font-bold text-slate-900">{item.bookTitle}</p>
                          <p className="text-xs text-slate-500">
                            {item.bookAuthor || item.category || 'Catalog'} •{' '}
                            <span className="font-mono text-slate-400">{item.bookId}</span>
                          </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-medium text-slate-800">{item.borrowerName}</p>
                          <p className="text-xs text-slate-400 font-mono">{item.borrowerId}</p>
                        </td>
                        <td className="px-6 py-4">
                          {item.isOverdue ? (
                            <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              OVERDUE ({item.daysOverdue}d)
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black tracking-wider uppercase">
                              ISSUED
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">
                          <span
                            className={
                              item.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }
                          >
                            {new Date(item.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setReturnTargetBookId(item.bookId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white dark:bg-[#182238] hover:bg-slate-50 dark:hover:bg-[#22304a] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <ArrowDownLeft className="w-3 h-3 text-teal-600" />
                            Return
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Recent Transactions</h3>
              <button
                onClick={() => navigate('/transactions')}
                className="text-teal-600 text-xs font-bold hover:underline"
              >
                View Full History
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.recentTransactions || []).slice(0, 5).map((t) => {
                const isReturned = t.status === 'RETURNED';
                const isOverdue = t.status === 'OVERDUE' || t.isOverdue;
                return (
                  <div
                    key={t.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1b2740] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isReturned
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-teal-50 text-teal-600'
                        }`}
                      >
                        {isReturned ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{t.bookTitle}</p>
                        <p className="text-xs text-slate-500">
                          {t.borrowerName} ({t.borrowerId}) •{' '}
                          <span className="font-mono text-slate-400">{t.bookId}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isReturned
                            ? 'bg-emerald-50 text-emerald-700'
                            : isOverdue
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {isReturned ? 'RETURNED' : isOverdue ? 'OVERDUE' : 'ISSUED'}
                      </span>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        {new Date(t.returnDate || t.issueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Quick Actions & System AI Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-base">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="quick-action-add-book"
                onClick={outletContext.openAddBook}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 gap-2 transition-colors group text-center"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Add Book</span>
              </button>

              <button
                id="quick-action-scan-qr"
                onClick={() => navigate('/scan')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 gap-2 transition-colors group text-center"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600 group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Scan QR</span>
              </button>

              <button
                id="quick-action-return-book"
                onClick={() => outletContext.openReturn()}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 gap-2 transition-colors group text-center"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Return</span>
              </button>

              <button
                id="quick-action-export-report"
                onClick={() => navigate('/reports')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 gap-2 transition-colors group text-center"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm text-teal-600 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-600">Export</span>
              </button>
            </div>
          </div>

          {/* System AI Status Gradient Card */}
          <div className="bg-gradient-to-br from-teal-600 to-violet-700 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-base">System AI Status</h3>
            </div>
            <p className="text-sm text-teal-100 leading-relaxed mb-4">
              All system services are operational. Automated overdue monitoring and smart catalog queries are active.
            </p>
            <div className="bg-white/10 rounded-lg p-3 border border-white/10 mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-teal-200">Database Health</span>
                <span className="font-bold text-white">99.9%</span>
              </div>
              <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '99%' }} />
              </div>
            </div>
            <button
              onClick={outletContext.openAI}
              className="w-full py-2 px-3 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              Ask LibrHub Assistant
            </button>
          </div>

          {/* Most Borrowed Books Leaderboard */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Most Borrowed Titles</h3>
              <span className="text-xs text-slate-400">Popularity Rank</span>
            </div>
            <div className="space-y-3">
              {charts.mostBorrowedBooks.length === 0 ? (
                <p className="text-xs text-slate-400">No loan history available yet</p>
              ) : (
                charts.mostBorrowedBooks.slice(0, 4).map((b, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <BookCover isbn={b.isbn} title={b.title} className="w-8 h-11 rounded-md shrink-0 shadow-sm" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">{b.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">By {b.author}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-700 shrink-0 font-mono">
                      {b.borrows} loans
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Books by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              Books by Category
            </h3>
            <span className="text-xs text-slate-400">Inventory Distribution</span>
          </div>

          <div className="space-y-3">
            {charts.booksByCategory.map((cat, idx) => {
              const percentage =
                stats.totalBooks > 0 ? Math.round((cat.count / stats.totalBooks) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{cat.category}</span>
                    <span className="text-slate-500 font-mono">
                      {cat.count} title{cat.count > 1 ? 's' : ''} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circulation Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-emerald-600" />
              Circulation Breakdown
            </h3>
            <span className="text-xs text-slate-400">Loan Lifecycle</span>
          </div>

          <div className="space-y-3 pt-1">
            {charts.issueVsReturn.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                </div>
                <span className="text-base font-extrabold text-slate-900">{item.count}</span>
              </div>
            ))}

            <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100">
              Circulation integrity is maintained with atomic transaction updates and copy decrements.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity: Issued & Returned Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Issued */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-teal-600" />
              Recently Issued Books
            </h3>
            <button
              onClick={() => navigate('/transactions?status=ISSUED')}
              className="text-xs font-bold text-teal-600 hover:text-teal-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {(data?.recentlyIssued || []).length === 0 ? (
              <p className="text-xs text-slate-400">No issues recorded yet</p>
            ) : (
              (data?.recentlyIssued || []).map((t) => (
                <div
  key={t.id}
  className="p-3 rounded-xl border border-[#e6dfd2] bg-white flex items-center justify-between text-xs"
>
                  <BookCover isbn={t.bookIsbn} title={t.bookTitle} className="w-9 h-12 rounded-md shrink-0 shadow-sm" />
                  <div className="min-w-0 ml-3 flex-1">
                    <div className="font-bold text-slate-900 line-clamp-1">{t.bookTitle}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1">
                      Issued to {t.borrowerName} ({t.borrowerId})
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-medium">
                    {new Date(t.issueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Returned */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Recently Returned Books
            </h3>
            <button
              onClick={() => navigate('/transactions?status=RETURNED')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {(data?.recentlyReturned || []).length === 0 ? (
              <p className="text-xs text-slate-400">No returns recorded yet</p>
            ) : (
              (data?.recentlyReturned || []).map((t) => (
                <div
  key={t.id}
  className="p-3 rounded-xl border border-[#e6dfd2] bg-white flex items-center justify-between text-xs"
>
                  <BookCover isbn={t.bookIsbn} title={t.bookTitle} className="w-9 h-12 rounded-md shrink-0 shadow-sm" />
                  <div className="min-w-0 ml-3 flex-1">
                    <div className="font-bold text-slate-900 line-clamp-1">{t.bookTitle}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1">
                      Returned by {t.borrowerName} ({t.borrowerId})
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-emerald-700 font-semibold">
                    {t.returnDate ? new Date(t.returnDate).toLocaleDateString() : 'Returned'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Return Modal for direct row action */}
      <ReturnModal
        isOpen={!!returnTargetBookId}
        onClose={() => setReturnTargetBookId(null)}
        onSuccess={() => {
          setReturnTargetBookId(null);
          loadData();
        }}
        initialBookId={returnTargetBookId || ''}
      />
    </div>
  );
};

export default DashboardPage;
