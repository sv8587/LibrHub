import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Book } from '../types';
import { bookApi, transactionApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookCover } from './BookCover';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBookId?: string;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBookId = '',
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [bookId, setBookId] = useState(initialBookId);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));

  // Default due date: 14 days from today
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().slice(0, 10));

  // Book lookup state
  const [verifiedBook, setVerifiedBook] = useState<Book | null>(null);
  const [isCheckingBook, setIsCheckingBook] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBookId(initialBookId);
      setBorrowerName('');
      setBorrowerId('');
      setFormError(null);
      setIssueDate(new Date().toISOString().slice(0, 10));
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 14);
      setDueDate(nextDue.toISOString().slice(0, 10));

      if (initialBookId) {
        lookupBook(initialBookId);
      } else {
        setVerifiedBook(null);
      }
    }
  }, [isOpen, initialBookId]);

  const lookupBook = async (id: string) => {
    if (!id.trim()) {
      setVerifiedBook(null);
      return;
    }
    setIsCheckingBook(true);
    setFormError(null);
    try {
      const book = await bookApi.getById(id.trim().toUpperCase());
      setVerifiedBook(book);
    } catch {
      setVerifiedBook(null);
    } finally {
      setIsCheckingBook(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!bookId.trim()) {
      setFormError('Book ID is required');
      return;
    }
    if (!borrowerName.trim()) {
      setFormError('Borrower name is required');
      return;
    }
    if (!borrowerId.trim()) {
      setFormError('Borrower ID / Student ID is required');
      return;
    }
    if (!/^RA25\d{11}$/.test(borrowerId.trim().toUpperCase())) {
      setFormError('Student ID must follow the format RA25XXXXXXXXXXX');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required');
      return;
    }

    const issueD = new Date(issueDate);
    const dueD = new Date(dueDate);
    if (dueD <= issueD) {
      setFormError('Due date must be after the issue date');
      return;
    }

    if (verifiedBook && verifiedBook.availableCopies <= 0) {
      setFormError('This book has 0 available copies and cannot be issued');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await transactionApi.issue({
        bookId: bookId.trim().toUpperCase(),
        borrowerName: borrowerName.trim(),
        borrowerId: borrowerId.trim().toUpperCase(),
        issueDate,
        dueDate,
      });

      success(res.message || 'Book issued successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to issue book';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUnavailable = verifiedBook && verifiedBook.availableCopies <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <ArrowUpRight className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Issue Book (Loan Checkout)</h3>
              <p className="text-xs text-slate-500">Record a new student or faculty book loan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Book ID Input with Live Lookup */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Book ID (Scan or Enter) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="issue-book-id-input"
                type="text"
                required
                placeholder="e.g. LIB-101"
                value={bookId}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setBookId(val);
                  lookupBook(val);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-10"
              />
              <div className="absolute right-3 top-3 text-slate-400">
                {isCheckingBook ? (
                  <div className="animate-spin w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Live Verification Box */}
            {verifiedBook && (
              <div
                className={`mt-2.5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  verifiedBook.availableCopies > 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                {verifiedBook.availableCopies > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <BookCover isbn={verifiedBook.isbn} title={verifiedBook.title} className="w-11 h-14 rounded-md shrink-0 shadow-sm" />
                <div>
                  <div className="font-bold">{verifiedBook.title}</div>
                  <div className="text-slate-600 text-[11px]">
                    By {verifiedBook.author} • Category: {verifiedBook.category}
                  </div>
                  <div className="mt-1 font-semibold">
                    {verifiedBook.availableCopies > 0 ? (
                      <span className="text-emerald-700">
                        ✓ {verifiedBook.availableCopies} copy(ies) available for checkout (Total:{' '}
                        {verifiedBook.totalCopies})
                      </span>
                    ) : (
                      <span className="text-rose-700">
                        ⚠ All {verifiedBook.totalCopies} copies are currently checked out! Cannot issue.
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
                id="issue-borrower-name-input"
                type="text"
                required
                placeholder="e.g. Aakriti Bansal"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Borrower ID / Student ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="issue-borrower-id-input"
                type="text"
                required
                maxLength={15}
                placeholder="e.g. RA2500000000001"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="issue-date-input"
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="issue-due-date-input"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!isUnavailable}
              id="confirm-issue-btn"
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 shadow-sm shadow-teal-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              {isSubmitting ? 'Processing Loan...' : 'Confirm Book Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IssueModal;
