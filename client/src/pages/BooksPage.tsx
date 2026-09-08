import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { Book } from '../types';
import { bookApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { BookModal } from '../components/BookModal';
import { QRModal } from '../components/QRModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { IssueModal } from '../components/IssueModal';
import { ReturnModal } from '../components/ReturnModal';
import { BookCover } from '../components/BookCover';

export const BooksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();
  const outletContext = useOutletContext<any>() || {};

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [availability, setAvailability] = useState(searchParams.get('availability') || 'all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'createdAt' | 'totalCopies' | 'availableCopies'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [selectedBookForQR, setSelectedBookForQR] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [issueBookId, setIssueBookId] = useState<string | null>(null);
  const [returnBookId, setReturnBookId] = useState<string | null>(null);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const res = await bookApi.getAll({
        search,
        category: category === 'All' ? '' : category,
        availability: availability === 'all' ? undefined : availability,
        sortBy,
        sortOrder,
        limit: 100,
      });
      setBooks(res.books || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bookApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadBooks();
  }, [search, category, availability, sortBy, sortOrder]);

  useEffect(() => {
    const handleRefresh = () => loadBooks();
    window.addEventListener('librhub-refresh-data', handleRefresh);
    return () => window.removeEventListener('librhub-refresh-data', handleRefresh);
  }, [search, category, availability, sortBy, sortOrder]);

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      await bookApi.delete(bookToDelete.id || bookToDelete.bookId);
      success(`Book "${bookToDelete.title}" removed from catalogue`);
      setBookToDelete(null);
      loadBooks();
    } catch (err: any) {
      error(err.response?.data?.message || err.message || 'Failed to delete book');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="hero-panel rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="section-icon"><BookOpen className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Books Catalogue</h1>
              <p className="text-xs text-slate-500 mt-1">A curated collection for your Indian campus library.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadBooks} title="Refresh catalogue" className="icon-button">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button id="books-add-btn" onClick={outletContext.openAddBook} className="primary-button">
            <Plus className="w-4 h-4" /> Add New Book
          </button>
        </div>
      </div>

      <div className="filter-panel rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-3">
        <div className="relative">
          <input
            id="books-search-input"
            type="text"
            placeholder="Search by title, author, book ID, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
        <select id="books-category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
          <option value="All">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select id="books-availability-filter" value={availability} onChange={(e) => setAvailability(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
          <option value="all">All Copies</option>
          <option value="available">Available</option>
          <option value="issued">Fully Issued</option>
        </select>
        <div className="flex items-center gap-2">
          <select id="books-sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="createdAt">Newest Added</option>
            <option value="title">Book Title</option>
            <option value="author">Author</option>
            <option value="availableCopies">Available Copies</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title="Toggle sort direction" className="icon-button">
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="catalogue-empty"><div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full" /><span>Loading your catalogue...</span></div>
      ) : books.length === 0 ? (
        <div className="catalogue-empty"><BookOpen className="w-10 h-10 opacity-30" /><p className="font-semibold text-slate-700">No books found</p><p>Try changing your search or filters.</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {books.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <article key={book.id || book.bookId} className="book-card group">
                <div className="book-card-cover-wrap">
                  <BookCover isbn={book.isbn} title={book.title} className="book-card-cover" />
                  <div className="book-card-status">
                    {isAvailable ? <span className="status-pill status-available"><CheckCircle2 className="w-3 h-3" /> Available</span> : <span className="status-pill status-issued"><Clock className="w-3 h-3" /> Issued</span>}
                  </div>
                </div>
                <div className="p-4">
                  <span className="category-pill">{book.category}</span>
                  <h3 className="mt-3 font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{book.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{book.author}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold text-slate-600">{book.bookId}</span>
                    <span className="text-slate-400">{book.availableCopies}/{book.totalCopies} copies</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {isAvailable ? <button onClick={() => setIssueBookId(book.bookId)} title="Issue this book" className="action-button action-primary"><ArrowUpRight className="w-3.5 h-3.5" /></button> : <button onClick={() => setReturnBookId(book.bookId)} title="Return this book" className="action-button action-return"><ArrowDownLeft className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => setSelectedBookForQR(book)} title="Generate QR" className="action-button"><QrCode className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setSelectedBookForEdit(book)} title="Edit book" className="action-button"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setBookToDelete(book)} title="Delete book" className="action-button action-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <BookModal isOpen={!!selectedBookForEdit} onClose={() => setSelectedBookForEdit(null)} onSuccess={() => { setSelectedBookForEdit(null); loadBooks(); }} bookToEdit={selectedBookForEdit} categories={categories} />
      <QRModal isOpen={!!selectedBookForQR} onClose={() => setSelectedBookForQR(null)} book={selectedBookForQR} />
      <DeleteConfirmModal isOpen={!!bookToDelete} onClose={() => setBookToDelete(null)} onConfirm={handleDeleteConfirm} title="Delete Book from Catalogue?" message={`Are you sure you want to permanently delete "${bookToDelete?.title}" (${bookToDelete?.bookId})? This action cannot be undone.`} isDeleting={isDeleting} />
      <IssueModal isOpen={!!issueBookId} onClose={() => setIssueBookId(null)} onSuccess={() => { setIssueBookId(null); loadBooks(); }} initialBookId={issueBookId || ''} />
      <ReturnModal isOpen={!!returnBookId} onClose={() => setReturnBookId(null)} onSuccess={() => { setReturnBookId(null); loadBooks(); }} initialBookId={returnBookId || ''} />
    </div>
  );
};

export default BooksPage;
