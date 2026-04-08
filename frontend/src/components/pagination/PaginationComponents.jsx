import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * LoadMore Button Component
 * Displays a "Load More" button with loading state
 * 
 * Props:
 * - onClick: function to call when button is clicked
 * - loading: boolean indicating if loading
 * - hasMore: boolean indicating if more items available
 * - label: custom label (default: "Load More")
 * - className: additional CSS classes
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
        className="px-6 py-2"
      >
        {loading ? (
          <>
            <span className="inline-block mr-2 animate-spin">⟳</span>
            Loading...
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
};

/**
 * Pagination Info Component
 * Displays current page info and total items
 * 
 * Props:
 * - page: current page number (0-based)
 * - totalPages: total number of pages
 * - totalItems: total number of items
 * - pageSize: items per page
 */
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

/**
 * Pagination Controls Component
 * Displays prev/next buttons and page info
 * 
 * Props:
 * - page: current page number (0-based)
 * - totalPages: total number of pages
 * - onPrevious: callback for previous button
 * - onNext: callback for next button
 * - loading: loading state
 */
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
      >
        ← Previous
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
      >
        Next →
      </Button>
    </div>
  );
};

/**
 * Empty State Component
 * Shows when no items are available
 */
export const EmptyState = ({ 
  message = 'No items found', 
  subMessage = '',
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-gray-400 text-4xl mb-2">📭</div>
      <p className="text-gray-600 font-medium">{message}</p>
      {subMessage && <p className="text-gray-400 text-sm">{subMessage}</p>}
    </div>
  );
};

/**
 * Loading Skeleton Component
 * Shows placeholder while loading
 */
export const LoadingSkeleton = ({ 
  count = 3, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-gray-200 rounded mb-3 h-12 animate-pulse"
        />
      ))}
    </div>
  );
};
