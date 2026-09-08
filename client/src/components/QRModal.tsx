import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { Book } from '../types';
import { bookApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookCover } from './BookCover';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, book }) => {
  const { success, error } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && book) {
      setIsLoading(true);
      bookApi
        .getQR(book.bookId)
        .then((res) => {
          setQrDataUrl(res.qrDataUrl);
        })
        .catch((err) => {
          error('Failed to generate QR code: ' + (err.message || 'Unknown error'));
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setQrDataUrl(null);
    }
  }, [isOpen, book]);

  if (!isOpen || !book) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${book.bookId}-${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    success(`QR code downloaded for ${book.bookId}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(book.bookId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success(`Copied Book ID "${book.bookId}" to clipboard`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <QrCode className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Library Book QR Label</h3>
              <p className="text-xs text-slate-500 font-mono">{book.bookId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Printable Sticker Preview Card */}
          <div
            id="printable-qr-sticker"
            className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center mx-auto max-w-xs"
          >
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
              LIBRHUB SMART LMS • INVENTORY
            </div>

            {isLoading ? (
              <div className="w-52 h-52 flex items-center justify-center bg-white rounded-xl shadow-xs border border-slate-200">
                <div className="animate-spin w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full" />
              </div>
            ) : qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${book.title}`}
                  className="w-48 h-48 object-contain"
                />
              </div>
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                Unable to render QR code
              </div>
            )}

            <div className="mt-4 flex flex-col items-center">
              <BookCover isbn={book.isbn} title={book.title} className="w-16 h-20 rounded-lg shadow-sm mb-3" />
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 text-white shadow-xs">
                {book.bookId}
              </span>
              <h4 className="mt-2 font-bold text-slate-900 text-sm line-clamp-2 px-2">
                {book.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">ISBN: {book.isbn}</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500 max-w-xs mx-auto">
            Scan with any mobile camera, webcam, or the dedicated <strong>LibrHub QR Scanner</strong> to instantly issue or return this physical copy.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? 'Copied' : 'Copy ID'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;
