import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem',
      borderTop: '1px solid var(--border-subtle)',
      fontSize: '0.875rem',
      color: 'var(--slate-600)'
    }}>
      <div>
        Showing <strong style={{ color: 'var(--slate-900)' }}>{startItem}</strong> to{' '}
        <strong style={{ color: 'var(--slate-900)' }}>{endItem}</strong> of{' '}
        <strong style={{ color: 'var(--slate-900)' }}>{totalItems}</strong> entries
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{ padding: '0.375rem 0.5rem' }}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onPageChange(page)}
            style={{ minWidth: '32px', padding: '0.375rem 0.625rem' }}
          >
            {page}
          </button>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{ padding: '0.375rem 0.5rem' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
