import React, { useEffect, useState } from 'react';

interface BookCoverProps {
  isbn?: string;
  title: string;
  author?: string;
  className?: string;
  imageClassName?: string;
}

const cleanIsbn = (isbn?: string) => isbn?.replace(/[^0-9Xx]/g, '') || '';

export const getExternalBookCoverUrl = (isbn?: string) => {
  const clean = cleanIsbn(isbn);
  return clean ? `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg?default=false` : '';
};

const getInitials = (title: string) =>
  title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'BK';

export const BookCover: React.FC<BookCoverProps> = ({
  isbn,
  title,
  author,
  className = '',
  imageClassName = '',
}) => {
  const externalUrl = getExternalBookCoverUrl(isbn);
  const [source, setSource] = useState(externalUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(externalUrl);
    setFailed(false);
  }, [externalUrl]);

  const handleError = () => {
    setFailed(true);
  };

  return (
    <div className={`book-cover ${className}`} aria-label={`Cover of ${title}`}>
      {!failed && source ? (
        <img
          src={source}
          alt={`Cover of ${title}`}
          loading="lazy"
          className={`w-full h-full object-cover ${imageClassName}`}
          onError={handleError}
        />
      ) : (
        <div className="book-cover-fallback w-full h-full flex flex-col items-center justify-center p-3 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">LibrHub Library</span>
          <span className="mt-2 text-xl font-black tracking-tight">{getInitials(title)}</span>
          <span className="mt-2 text-[9px] font-semibold leading-tight line-clamp-3">{title}</span>
          {author && <span className="mt-1 text-[8px] opacity-75 line-clamp-2">{author}</span>}
        </div>
      )}
    </div>
  );
};

export default BookCover;
