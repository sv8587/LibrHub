import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  BookOpen,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Book, Transaction } from '../types';
import { bookApi, transactionApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { IssueModal } from '../components/IssueModal';
import { ReturnModal } from '../components/ReturnModal';
import { BookCover } from '../components/BookCover';

export const QRScannerPage: React.FC = () => {
  const { success, error, info } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Scanned Book result
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [activeLoan, setActiveLoan] = useState<Transaction | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Modals for actions
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5-qr-reader-container';

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping QR scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      setIsScanning(true);

      const qrCodeSuccessCallback = async (decodedText: string) => {
        // Stop scanning after successful decode
        await stopScanner();
        handleScannedPayload(decodedText);
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        undefined
      );
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setCameraError(
        'Camera access denied, not found, or unsupported in this browser environment. Please ensure camera permissions are granted, or use the manual code input below.'
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleScannedPayload = async (rawText: string) => {
    let cleanId = rawText.trim();

    // Try parsing JSON payload format from LibrHub QR generator
    try {
      if (cleanId.startsWith('{') && cleanId.endsWith('}')) {
        const parsed = JSON.parse(cleanId);
        if (parsed.bookId) {
          cleanId = parsed.bookId;
        }
      }
    } catch {
      // Not JSON, use raw text
    }

    cleanId = cleanId.toUpperCase();
    lookupBookRecord(cleanId);
  };

  const lookupBookRecord = async (targetId: string) => {
    if (!targetId.trim()) return;
    setIsVerifying(true);
    setScannedBook(null);
    setActiveLoan(null);

    try {
      const book = await bookApi.getById(targetId);
      setScannedBook(book);
      success(`Scanned Book: "${book.title}" (${book.bookId})`);

      // Check active loan status
      const loanRes = await transactionApi.getActiveByBook(book.bookId);
      if (loanRes.activeTransaction) {
        setActiveLoan(loanRes.activeTransaction);
      }
    } catch (err: any) {
      error(`Could not locate Book ID "${targetId}" in library catalogue`);
    } finally {
      setIsVerifying(false);
    }
  };

  const refreshScannedState = () => {
    if (scannedBook) {
      lookupBookRecord(scannedBook.bookId);
    }
  };

  useEffect(() => {
    const handleRefresh = () => refreshScannedState();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, [scannedBook]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-sm">
            <QrCode className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Interactive QR Scanner & Checkpoint
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly scan physical book labels to verify status, checkout copies, or process returns.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Camera View & Manual Input */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-600" />
              Device Camera Scan
            </h3>
            {isScanning ? (
              <button
                onClick={stopScanner}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Stop Camera
              </button>
            ) : (
              <button
                id="start-camera-scan-btn"
                onClick={startScanner}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200 flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Activate Camera
              </button>
            )}
          </div>

          {/* Camera View Box */}
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-900 flex flex-col items-center justify-center min-h-[280px]">
            <div
              id={scannerContainerId}
              className={`w-full ${isScanning ? 'block' : 'hidden'}`}
            />

            {!isScanning && (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <QrCode className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs font-medium text-slate-300">Camera is inactive</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Click "Activate Camera" to enable webcam or mobile camera scanning.
                </p>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{cameraError}</div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Manual Book ID Input (Testing & Direct Check)
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookupBookRecord(manualInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                id="manual-scan-input"
                type="text"
                placeholder="e.g. LIB-101, LIB-102, LIB-103..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                id="manual-scan-submit-btn"
                disabled={!manualInput.trim() || isVerifying}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                Lookup
              </button>
            </form>

            {/* Quick Testing Chips */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Quick Test Samples:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['LIB-101', 'LIB-102', 'LIB-103', 'LIB-104', 'LIB-105'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setManualInput(id);
                      lookupBookRecord(id);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-[11px] font-mono font-semibold transition-colors border border-slate-200/60"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Scanned Book Information & Dynamic Workflow */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Scanned Book Information
              </h3>
              {scannedBook && (
                <button
                  onClick={refreshScannedState}
                  title="Reload book status"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isVerifying ? (
              <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full" />
                <span>Verifying book record from database...</span>
              </div>
            ) : !scannedBook ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <Zap className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No book scanned yet</p>
                <p className="text-slate-400 max-w-xs mx-auto text-[11px]">
                  Point camera at a book's QR label or select a sample Book ID on the left to review status.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Book Card */}
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-bold bg-slate-900 text-white">
                      {scannedBook.bookId}
                    </span>
                    {scannedBook.availableCopies > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Available for Loan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700">
                        <Clock className="w-3.5 h-3.5" />
                        Fully Issued
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <BookCover isbn={scannedBook.isbn} title={scannedBook.title} className="w-14 h-20 rounded-lg shadow-sm shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">{scannedBook.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">By {scannedBook.author}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1 border-t border-slate-200/60 font-medium">
                    <span>Category: {scannedBook.category}</span>
                    <span>•</span>
                    <span>ISBN: {scannedBook.isbn}</span>
                  </div>
                </div>

                {/* Copies stock info */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="text-slate-400 font-medium">Available Shelf Stock:</span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {scannedBook.availableCopies}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        / {scannedBook.totalCopies} copies
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-2xs">
                    <span className="text-slate-400 font-medium">Circulation Status:</span>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {scannedBook.availableCopies > 0
                        ? `${scannedBook.availableCopies} available to borrow`
                        : 'All copies checked out'}
                    </div>
                  </div>
                </div>

                {/* Active Borrower Information if issued */}
                {activeLoan && (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>Active Loan Details</span>
                      {activeLoan.isOverdue ? (
                        <span className="text-rose-700 font-bold">
                          {activeLoan.daysOverdue} Day(s) Overdue
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">On Schedule</span>
                      )}
                    </div>
                    <div className="text-slate-800">
                      <strong>Borrower:</strong> {activeLoan.borrowerName} (ID: {activeLoan.borrowerId})
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Issued on {new Date(activeLoan.issueTimestamp).toLocaleDateString()} • Due on{' '}
                      {new Date(activeLoan.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workflow Action Buttons */}
          {scannedBook && (
            <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
              {scannedBook.availableCopies > 0 ? (
                <button
                  id="scanner-issue-btn"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm shadow-teal-200 transition-all"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Issue This Book
                </button>
              ) : null}

              <button
                id="scanner-return-btn"
                onClick={() => setIsReturnModalOpen(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs transition-all shadow-sm ${
                  scannedBook.availableCopies === 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Return / Check-in Book
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals with Pre-filled Scanned Book ID */}
      {scannedBook && (
        <>
          <IssueModal
            isOpen={isIssueModalOpen}
            onClose={() => setIsIssueModalOpen(false)}
            onSuccess={() => {
              setIsIssueModalOpen(false);
              refreshScannedState();
            }}
            initialBookId={scannedBook.bookId}
          />

          <ReturnModal
            isOpen={isReturnModalOpen}
            onClose={() => setIsReturnModalOpen(false)}
            onSuccess={() => {
              setIsReturnModalOpen(false);
              refreshScannedState();
            }}
            initialBookId={scannedBook.bookId}
          />
        </>
      )}
    </div>
  );
};

export default QRScannerPage;
