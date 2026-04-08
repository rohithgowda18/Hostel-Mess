import React, { useEffect } from 'react';
import { LoadingSkeleton, EmptyState } from '@/components/pagination/PaginationComponents';

/**
 * InfiniteScrollContainer Component
 * Wrapper for infinite scroll chat messages
 * 
 * Props:
 * - messages: array of message objects
 * - renderMessage: function to render each message
 * - onLoadMore: callback when scrolling near top
 * - loading: loading state
 * - hasMore: boolean indicating more messages available
 * - containerRef: ref from useInfiniteScroll hook
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
    const container = ref?.current;
    if (!container) return;

    const handleScroll = () => {
      if (onScroll) {
        onScroll();
      }

      // Load more when scroll reaches top
      if (container.scrollTop < 50 && hasMore && !loading && onLoadMore) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [ref, onLoadMore, hasMore, loading, onScroll]);

  return (
    <div
      ref={ref}
      className={`flex-1 overflow-y-auto bg-gray-50 ${className}`}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {loading && messages.length === 0 && (
        <LoadingSkeleton count={5} className="p-4" />
      )}

      {messages.length === 0 && !loading && (
        <EmptyState 
          message={emptyMessage}
          className="h-full"
        />
      )}

      {messages.length > 0 && (
        <div className="space-y-2 p-3">
          {loading && hasMore && (
            <div className="text-center py-2">
              <span className="inline-block animate-spin text-gray-400">⟳</span>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={message.id || index}>
              {renderMessage(message)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

InfiniteScrollContainer.displayName = 'InfiniteScrollContainer';

/**
 * ChatMessageGroup Component
 * Groups consecutive messages from same sender
 */
export const ChatMessageGroup = ({ 
  messages = [], 
  renderMessage 
}) => {
  return (
    <div className="space-y-1">
      {messages.map((message, index) => (
        <div key={message.id || index} className="mb-2">
          {renderMessage(message)}
        </div>
      ))}
    </div>
  );
};

/**
 * ScrollToBottom Button
 * Shows when user scrolls up and helps them return to bottom
 */
export const ScrollToBottomButton = ({ 
  visible = false, 
  onClick,
  className = ''
}) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg hover:bg-blue-700 transition-colors z-10 ${className}`}
    >
      ↓ New messages
    </button>
  );
};
