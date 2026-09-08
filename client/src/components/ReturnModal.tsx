import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, AlertCircle, CheckCircle2, Clock, Search } from 'lucide-react';
import { Transaction } from '../types';
import { transactionApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookCover } from './BookCover';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialBookId?: string;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialBookId = '',
}) => {
  const { success, error } = useToast();
  const [bookId, setBookId] = useState(initialBookId);
  const [activeTxn, setActiveTxn] = useState<Transaction | null>(null);
  const [isLoadingTxn, setIsLoadingTxn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBookId(initialBookId);
      setFormError(null);
      if (initialBookId) {
        checkActiveLoan(initialBookId);
      } else {
        setActiveTxn(null);
      }
    }
  }, [isOpen, initialBookId]);

  const checkActiveLoan = async (id: string) => {
    if (!id.trim()) {
      setActiveTxn(null);
      return;
    }
    setIsLoadingTxn(true);
    setFormError(null);
    try {
      const res = await transactionApi.getActiveByBook(id.trim().toUpperCase());
      if (res.activeTransaction) {
        setActiveTxn(res.activeTransaction);
      } else {
        setActiveTxn(null);
        setFormError(`No active issued loan found for Book ID "${id.trim().toUpperCase()}".`);
      }
    } catch (err: any) {
      setActiveTxn(null);
      setFormError(err.message || 'Error checking active loan');
    } finally {
      setIsLoadingTxn(false);
    }
  };

  if (!isOpen) return null;

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId.trim()) {
      setFormError('Book ID is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await transactionApi.returnBook({
        bookId: bookId.trim().toUpperCase(),
        transactionId: activeTxn ? activeTxn.id : undefined,
      });

      success(res.message || `Book returned successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Return failed';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Return Book (Check-in)</h3>
              <p className="text-xs text-slate-500">Check in an issued book and restore shelf stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleReturn} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Book ID (Scan or Enter) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="return-book-id-input"
                type="text"
                required
                placeholder="e.g. LIB-102"
                value={bookId}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setBookId(val);
                  checkActiveLoan(val);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
              />
              <div className="absolute right-3 top-3 text-slate-400">
                {isLoadingTxn ? (
                  <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>

          {/* Active Loan Details Card */}
          {activeTxn && (
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Loan Record
                </span>
                {activeTxn.isOverdue ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeTxn.daysOverdue} Days Overdue
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    On Time Return
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <BookCover isbn={activeTxn.bookIsbn} title={activeTxn.bookTitle || 'Book'} className="w-11 h-14 rounded-md shrink-0 shadow-sm" />
                <div>
                <h4 className="font-bold text-slate-900 text-sm">{activeTxn.bookTitle}</h4>
                <p className="text-xs text-slate-500">Book ID: {activeTxn.bookId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-medium">Borrower:</span>
                  <div className="font-semibold text-slate-800">{activeTxn.borrowerName}</div>
                  <div className="text-[11px] font-mono text-slate-500">{activeTxn.borrowerId}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Issued On:</span>
                  <div className="font-medium text-slate-700">
                    {new Date(activeTxn.issueTimestamp).toLocaleDateString()}
                  </div>
                  <span className="text-slate-400 font-medium">Due Date:</span>
                  <div className="font-medium text-slate-700">
                    {new Date(activeTxn.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
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
              disabled={isSubmitting || !activeTxn}
              id="confirm-return-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              {isSubmitting ? 'Recording Check-in...' : 'Confirm Book Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;
