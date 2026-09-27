import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Pagination UI kit. Ported from temp-save-before-pull
 * (chat-pagination-message-windowing) and theme-aligned.
 */

export const LoadMoreButton = ({
  onClick,
  loading = false,
  hasMore = true,
  label = 'Load More',
  className = '',
  disabled = false
}) => {
  if (!hasMore) return null;

  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <Button
        onClick={onClick}
        disabled={loading || disabled}
        variant="outline"
        className="px-6 py-2 min-h-[44px]"
      >
        {loading ? 'Loading...' : label}
      </Button>
    </div>
  );
};

export const PaginationInfo = ({
  page = 0,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  className = ''
}) => {
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalItems);

  if (totalItems === 0) {
    return (
      <div className={`text-sm text-gray-500 text-center py-2 ${className}`}>
        No items found
      </div>
    );
  }

  return (
    <div className={`text-xs text-gray-600 text-center py-2 ${className}`}>
      Showing {startItem}-{endItem} of {totalItems} items
      {totalPages > 1 && ` (Page ${page + 1}/${totalPages})`}
    </div>
  );
};

export const PaginationControls = ({
  page = 0,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
  onPrevious,
  onNext,
  loading = false,
  className = ''
}) => {
  const canGoPrevious = page > 0;
  const canGoNext = page < totalPages - 1;

  return (
    <div className={`flex items-center justify-between py-4 px-2 ${className}`}>
      <Button
        onClick={onPrevious}
        disabled={!canGoPrevious || loading}
        variant="outline"
        size="sm"
        className="min-h-[44px]"
      >
        Previous
      </Button>

      <PaginationInfo
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      <Button
        onClick={onNext}
        disabled={!canGoNext || loading}
        variant="outline"
        size="sm"
        className="min-h-[44px]"
      >
        Next
      </Button>
    </div>
  );
};

export const EmptyState = ({
  message = 'No items found',
  subMessage = '',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <span className="material-symbols-outlined text-4xl mb-2 opacity-40">inbox</span>
      <p className="text-gray-600 font-medium">{message}</p>
      {subMessage && <p className="text-gray-400 text-sm">{subMessage}</p>}
    </div>
  );
};

export const LoadingSkeleton = ({
  count = 3,
  className = ''
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 dark:bg-[#334155] rounded mb-3 h-12 animate-pulse"
        />
      ))}
    </div>
  );
};
