import React, { useState, useEffect } from 'react';
import { X, BookPlus, BookOpenCheck, AlertCircle } from 'lucide-react';
import { Book } from '../types';
import { bookApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookToEdit?: Book | null;
  categories: string[];
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bookToEdit,
  categories,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    bookId: '',
    isbn: '',
    category: '',
    customCategory: '',
    totalCopies: 1,
    availableCopies: 1,
  });

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        title: bookToEdit.title,
        author: bookToEdit.author,
        bookId: bookToEdit.bookId,
        isbn: bookToEdit.isbn,
        category: bookToEdit.category,
        customCategory: '',
        totalCopies: bookToEdit.totalCopies,
        availableCopies: bookToEdit.availableCopies,
      });
    } else {
      // Auto-generate suggested ID
      const randomNum = Math.floor(100 + Math.random() * 900);
      setFormData({
        title: '',
        author: '',
        bookId: `LIB-${randomNum}`,
        isbn: '978-',
        category: categories[0] || 'Computer Science',
        customCategory: '',
        totalCopies: 3,
        availableCopies: 3,
      });
    }
    setFormError(null);
  }, [bookToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const categoryToSave =
      formData.category === '__NEW__' ? formData.customCategory.trim() : formData.category.trim();

    if (!formData.title.trim()) {
      setFormError('Book title is required');
      return;
    }
    if (!formData.author.trim()) {
      setFormError('Author name is required');
      return;
    }
    if (!formData.bookId.trim()) {
      setFormError('Book ID is required');
      return;
    }
    if (!formData.isbn.trim()) {
      setFormError('ISBN is required');
      return;
    }
    if (!categoryToSave) {
      setFormError('Please select or specify a category');
      return;
    }
    if (formData.totalCopies < 0) {
      setFormError('Total copies cannot be negative');
      return;
    }
    if (formData.availableCopies < 0) {
      setFormError('Available copies cannot be negative');
      return;
    }
    if (formData.availableCopies > formData.totalCopies) {
      setFormError('Available copies cannot exceed total copies');
      return;
    }

    setIsSubmitting(true);
    try {
      if (bookToEdit) {
        await bookApi.update(bookToEdit.id || bookToEdit.bookId, {
          title: formData.title,
          author: formData.author,
          bookId: formData.bookId.toUpperCase(),
          isbn: formData.isbn,
          category: categoryToSave,
          totalCopies: Number(formData.totalCopies),
          availableCopies: Number(formData.availableCopies),
        });
        success(`Book "${formData.title}" updated successfully`);
      } else {
        await bookApi.create({
          title: formData.title,
          author: formData.author,
          bookId: formData.bookId.toUpperCase(),
          isbn: formData.isbn,
          category: categoryToSave,
          totalCopies: Number(formData.totalCopies),
          availableCopies: Number(formData.availableCopies),
        });
        success(`Book "${formData.title}" added to catalogue`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              {bookToEdit ? <BookOpenCheck className="w-5 h-5 text-teal-400" /> : <BookPlus className="w-5 h-5 text-teal-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {bookToEdit ? 'Edit Book Record' : 'Add New Book'}
              </h3>
              <p className="text-xs text-slate-500">
                {bookToEdit ? `Updating ID: ${bookToEdit.bookId}` : 'Register a new title into the library catalogue'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Book Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="book-title-input"
              type="text"
              required
              placeholder="e.g. Clean Architecture: A Craftsman's Guide"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Author(s) <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-author-input"
                type="text"
                required
                placeholder="e.g. Chetan Bhagat"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Book ID (Unique Identifier) <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-id-input"
                type="text"
                required
                placeholder="e.g. LIB-101"
                value={formData.bookId}
                onChange={(e) => setFormData({ ...formData, bookId: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ISBN Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="book-isbn-input"
                type="text"
                required
                placeholder="e.g. 978-0134494166"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category / Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="book-category-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__NEW__">+ Custom / New Category</option>
              </select>
            </div>
          </div>

          {formData.category === '__NEW__' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Specify New Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Data Science & Analytics"
                value={formData.customCategory}
                onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-teal-300 bg-teal-50/30 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Copies
              </label>
              <input
                id="book-total-copies-input"
                type="number"
                min="0"
                required
                value={formData.totalCopies}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    totalCopies: val,
                    availableCopies: Math.min(prev.availableCopies, val),
                  }));
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Available Copies
              </label>
              <input
                id="book-available-copies-input"
                type="number"
                min="0"
                max={formData.totalCopies}
                required
                value={formData.availableCopies}
                onChange={(e) => setFormData({ ...formData, availableCopies: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <strong>Automatic Status Rule:</strong> If Available Copies &gt; 0, status is automatically{' '}
            <span className="text-emerald-700 font-semibold">"Available"</span>. If Available Copies === 0, status is automatically{' '}
            <span className="text-teal-700 font-semibold">"Issued"</span>.
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
              disabled={isSubmitting}
              id="book-submit-btn"
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 shadow-sm shadow-teal-200 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : bookToEdit ? 'Save Changes' : 'Add Book to Catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;
