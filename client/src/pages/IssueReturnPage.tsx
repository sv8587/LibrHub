import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  BookOpen,
  User,
  RefreshCw,
} from 'lucide-react';
import { Book, Transaction } from '../types';
import { bookApi, transactionApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookCover } from '../components/BookCover';

export const IssueReturnPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'issue' | 'return'>(
    (searchParams.get('tab') as 'issue' | 'return') || 'issue'
  );

  // Issue State
  const [issueBookId, setIssueBookId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().slice(0, 10));

  const [issueVerifiedBook, setIssueVerifiedBook] = useState<Book | null>(null);
  const [isCheckingIssueBook, setIsCheckingIssueBook] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Return State
  const [returnBookId, setReturnBookId] = useState('');
  const [activeLoan, setActiveLoan] = useState<Transaction | null>(null);
  const [isCheckingReturn, setIsCheckingReturn] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  // Issue Book Lookup
  const checkIssueBook = async (id: string) => {
    if (!id.trim()) {
      setIssueVerifiedBook(null);
      return;
    }
    setIsCheckingIssueBook(true);
    setIssueError(null);
    try {
      const b = await bookApi.getById(id.trim().toUpperCase());
      setIssueVerifiedBook(b);
    } catch {
      setIssueVerifiedBook(null);
    } finally {
      setIsCheckingIssueBook(false);
    }
  };

  // Return Loan Lookup
  const checkReturnLoan = async (id: string) => {
    if (!id.trim()) {
      setActiveLoan(null);
      return;
    }
    setIsCheckingReturn(true);
    setReturnError(null);
    try {
      const res = await transactionApi.getActiveByBook(id.trim().toUpperCase());
      if (res.activeTransaction) {
        setActiveLoan(res.activeTransaction);
      } else {
        setActiveLoan(null);
        setReturnError(`No active issued loan found for Book ID "${id.trim().toUpperCase()}".`);
      }
    } catch (err: any) {
      setActiveLoan(null);
      setReturnError(err.message || 'Error checking return record');
    } finally {
      setIsCheckingReturn(false);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      if (issueBookId.trim()) checkIssueBook(issueBookId);
      if (returnBookId.trim()) checkReturnLoan(returnBookId);
    };
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, [issueBookId, returnBookId]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueError(null);

    if (!issueBookId.trim()) {
      setIssueError('Book ID is required');
      return;
    }
    if (!borrowerName.trim()) {
      setIssueError('Borrower name is required');
      return;
    }
    if (!borrowerId.trim()) {
      setIssueError('Borrower ID is required');
      return;
    }
    if (!/^RA25\d{11}$/.test(borrowerId.trim().toUpperCase())) {
      setIssueError('Student ID must follow the format RA25XXXXXXXXXXX');
      return;
    }

    if (new Date(dueDate) <= new Date(issueDate)) {
      setIssueError('Due date must be after issue date');
      return;
    }

    if (issueVerifiedBook && issueVerifiedBook.availableCopies <= 0) {
      setIssueError('This book is currently unavailable. All copies have been issued.');
      return;
    }

    setIsSubmittingIssue(true);
    try {
      const res = await transactionApi.issue({
        bookId: issueBookId.trim().toUpperCase(),
        borrowerName: borrowerName.trim(),
        borrowerId: borrowerId.trim().toUpperCase(),
        issueDate,
        dueDate,
      });

      success(`Successfully issued "${res.transaction.bookTitle}" to ${res.transaction.borrowerName}!`);
      setIssueBookId('');
      setBorrowerName('');
      setBorrowerId('');
      setIssueVerifiedBook(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to issue book';
      setIssueError(msg);
      error(msg);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReturnError(null);

    if (!returnBookId.trim()) {
      setReturnError('Book ID is required');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await transactionApi.returnBook({
        bookId: returnBookId.trim().toUpperCase(),
        transactionId: activeLoan ? activeLoan.id : undefined,
      });

      success(`Book "${res.transaction.bookTitle}" checked in successfully! Stock restored.`);
      setReturnBookId('');
      setActiveLoan(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Return failed';
      setReturnError(msg);
      error(msg);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-5 h-5 text-teal-600" />
            Circulation Desk: Issue & Return
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perform daily checkouts, track borrower loan periods, and verify check-ins with instant stock updates.
          </p>
        </div>
        <button
          onClick={() => { if (issueBookId.trim()) checkIssueBook(issueBookId); if (returnBookId.trim()) checkReturnLoan(returnBookId); }}
          title="Refresh book and loan status"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'issue'
                ? 'bg-white text-teal-600 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Issue Book
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'return'
                ? 'bg-white text-emerald-700 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Return Book
          </button>
        </div>
      </div>

      {/* Main Flow Content */}
      {activeTab === 'issue' ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Issue Book to Patron</h3>
              <p className="text-xs text-slate-500">
                Record student/faculty details, select return due date, and automatically decrement available shelf copies.
              </p>
            </div>
          </div>

          {issueError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{issueError}</span>
            </div>
          )}

          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Book ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="desk-issue-book-id"
                  type="text"
                  required
                  placeholder="e.g. LIB-101"
                  value={issueBookId}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setIssueBookId(val);
                    checkIssueBook(val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                />
                <div className="absolute right-3 top-3 text-slate-400">
                  {isCheckingIssueBook ? (
                    <div className="animate-spin w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </div>
              </div>

              {issueVerifiedBook && (
                <div
                  className={`mt-2.5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    issueVerifiedBook.availableCopies > 0
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  {issueVerifiedBook.availableCopies > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{issueVerifiedBook.title}</div>
                    <div className="text-slate-600 text-[11px]">
                      By {issueVerifiedBook.author} • Category: {issueVerifiedBook.category}
                    </div>
                    <div className="mt-1 font-semibold">
                      {issueVerifiedBook.availableCopies > 0 ? (
                        <span className="text-emerald-700">
                          ✓ {issueVerifiedBook.availableCopies} available of{' '}
                          {issueVerifiedBook.totalCopies} total copies
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold">
                          ⚠ 0 copies available. Book is fully issued!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Borrower Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="desk-issue-borrower-name"
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Borrower ID / Student ID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="desk-issue-borrower-id"
                  type="text"
                  required
                  maxLength={15}
                  placeholder="e.g. RA2500000000001"
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Date
                </label>
                <input
                  id="desk-issue-date"
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Due Date
                </label>
                <input
                  id="desk-issue-due-date"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                id="desk-confirm-issue-btn"
                disabled={
                  isSubmittingIssue ||
                  (issueVerifiedBook !== null && issueVerifiedBook.availableCopies <= 0)
                }
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm shadow-teal-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                {isSubmittingIssue ? 'Issuing Book...' : 'Confirm Loan Checkout'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Return Book (Check-in)</h3>
              <p className="text-xs text-slate-500">
                Identify active loan, close the borrow record with return timestamp, and replenish shelf inventory.
              </p>
            </div>
          </div>

          {returnError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{returnError}</span>
            </div>
          )}

          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Book ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="desk-return-book-id"
                  type="text"
                  required
                  placeholder="e.g. LIB-102"
                  value={returnBookId}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setReturnBookId(val);
                    checkReturnLoan(val);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                />
                <div className="absolute right-3 top-3 text-slate-400">
                  {isCheckingReturn ? (
                    <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Active Loan Details */}
            {activeLoan && (
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Loan Details
                  </span>
                  {activeLoan.isOverdue ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeLoan.daysOverdue} Days Overdue
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      On Schedule
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <BookCover isbn={activeLoan.bookIsbn} title={activeLoan.bookTitle || 'Book'} className="w-12 h-16 rounded-md shrink-0 shadow-sm" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{activeLoan.bookTitle}</h4>
                    <p className="text-xs text-slate-500">Book ID: {activeLoan.bookId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium">Borrower:</span>
                    <div className="font-semibold text-slate-800">{activeLoan.borrowerName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{activeLoan.borrowerId}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Loan Dates:</span>
                    <div className="text-slate-700">
                      Issued: {new Date(activeLoan.issueTimestamp).toLocaleDateString()}
                    </div>
                    <div className="text-slate-700 font-medium">
                      Due: {new Date(activeLoan.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                id="desk-confirm-return-btn"
                disabled={isSubmittingReturn || !activeLoan}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowDownLeft className="w-4 h-4" />
                {isSubmittingReturn ? 'Processing Return...' : 'Confirm Book Check-in'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default IssueReturnPage;
