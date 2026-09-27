import React, { useEffect } from 'react';
import { LoadingSkeleton, EmptyState } from '@/components/pagination/PaginationComponents';

/**
 * InfiniteScrollContainer — scrollable wrapper for infinite chat history.
 * Ported from temp-save-before-pull (chat-pagination-message-windowing).
 *
 * Props:
 * - messages: array of message objects
 * - renderMessage: function to render each message
 * - onLoadMore: callback when scrolling near top
 * - loading: loading state
 * - hasMore: boolean indicating more messages available
 * - onScroll: scroll handler from useInfiniteScroll hook
 * - emptyMessage: message to show when no messages
 * - errorMessage: error message to display
 */
export const InfiniteScrollContainer = React.forwardRef(({
  messages = [],
  renderMessage,
  onLoadMore,
  loading = false,
  hasMore = true,
  onScroll,
  emptyMessage = 'No messages yet',
  errorMessage = null,
  className = ''
}, ref) => {
  useEffect(() => {
    if (ref?.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages.length === 0]);

  return (
    <div ref={ref} onScroll={onScroll} className={`overflow-y-auto ${className}`}>
      {hasMore && (
        <div className="text-center py-2">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="text-xs font-semibold text-[#003f87] dark:text-[#3B82F6] hover:underline disabled:opacity-50 min-h-[44px] px-4"
          >
            {loading ? 'Loading older messages...' : 'Load older messages'}
          </button>
        </div>
      )}
      {loading && messages.length === 0 && <LoadingSkeleton count={3} />}
      {errorMessage && (
        <div className="text-center text-xs text-[#ba1a1a] dark:text-[#EF4444] py-2">{errorMessage}</div>
      )}
      {!loading && messages.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        messages.map((message, index) =>
          renderMessage ? renderMessage(message, index) : null
        )
      )}
    </div>
  );
});

InfiniteScrollContainer.displayName = 'InfiniteScrollContainer';
