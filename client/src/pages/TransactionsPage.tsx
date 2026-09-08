import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { Transaction } from '../types';
import { transactionApi, reportApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookCover } from '../components/BookCover';

export const TransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionApi.getAll({
        search,
        status: status as any,
        page,
        limit: 15,
      });
      setTransactions(res.transactions || []);
      setTotalPages(res.pagination.pages || 1);
      setTotalRecords(res.pagination.total || 0);
    } catch (err: any) {
      error(err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [search, status, page]);

  useEffect(() => {
    const handleRefresh = () => loadTransactions();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, [search, status, page]);

  const handleExportCsv = async () => {
    try {
      await reportApi.downloadCsv();
      success('Transaction history CSV downloaded successfully');
    } catch (err: any) {
      error('Failed to export CSV: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-5 h-5 text-teal-600" />
            Audit & Circulation Log (Transactions)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete immutable ledger of all book issues, check-ins, borrower records, and overdue tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTransactions}
            title="Refresh transactions"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            id="txn-search-input"
            type="text"
            placeholder="Search by borrower name, ID, book title, or book ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Status:</label>
          <select
            id="txn-status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">All Statuses ({totalRecords})</option>
            <option value="ISSUED">Active Loans (Issued)</option>
            <option value="RETURNED">Completed Returns</option>
            <option value="OVERDUE">Overdue Only ⚠</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <div className="animate-spin w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full" />
            <span>Loading transaction logs...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-700 text-sm">No transactions match your search criteria</p>
            <p className="text-slate-400 mt-1">Try selecting a different status filter or clear your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                  <th className="py-3 px-6">Book Details & ID</th>
                  <th className="py-3 px-4">Borrower Details</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((t) => (
                  <tr key={t.id || t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-6 max-w-xs">
                      <div className="flex items-center gap-3">
                        <BookCover isbn={t.bookIsbn} title={t.bookTitle || 'Book'} className="w-10 h-14 rounded-md shrink-0 shadow-sm" />
                        <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{t.bookTitle}</div>
                      <div className="text-[11px] text-slate-500">
                        By {t.bookAuthor} • <span className="font-mono font-bold text-slate-800">{t.bookId}</span>
                        </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{t.borrowerName}</div>
                      <div className="text-[11px] font-mono text-slate-500">ID: {t.borrowerId}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(t.issueTimestamp).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(t.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      {t.returnTimestamp ? (
                        <span className="text-slate-700 font-medium">
                          {new Date(t.returnTimestamp).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not returned yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-6 text-center">
                      {t.isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700">
                          <AlertTriangle className="w-3 h-3" />
                          OVERDUE ({t.daysOverdue}d)
                        </span>
                      ) : t.status === 'RETURNED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          RETURNED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700">
                          <Clock className="w-3 h-3" />
                          ISSUED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages} ({totalRecords} total entries)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
