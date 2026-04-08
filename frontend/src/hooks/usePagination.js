import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for paginated list loading with load more button
 * Default page size: 20, Max page size: 100
 * 
 * Usage:
 * const {
 *   items,
 *   loading,
 *   error,
 *   hasMore,
 *   page,
 *   loadMore,
 *   reset,
 *   totalItems
 * } = usePagination(fetchFunction, 20);
 */
export const usePagination = (fetchFunction, initialPageSize = 20) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = Math.min(initialPageSize, 100);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFunction(page, pageSize);
      
      // Handle PaginatedResponse format
      const newItems = response.data || response;
      const totalPages = response.totalPages !== undefined ? response.totalPages : 1;
      const currentTotal = response.totalElements || 0;

      setItems((prev) => [...prev, ...newItems]);
      setTotalItems(currentTotal);
      setHasMore(page + 1 < totalPages);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err.message || 'Failed to load items');
      console.error('Pagination error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(0);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setTotalItems(0);
  }, []);

  // Load first page on mount
  useEffect(() => {
    loadMore();
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    reset,
    totalItems
  };
};

/**
 * Custom hook for infinite scroll chat functionality
 * Uses reverse chronological ordering (newest first)
 * 
 * Usage:
 * const {
 *   messages,
 *   loading,
 *   error,
 *   hasMore,
 *   loadPrevious,
 *   sendMessage,
 *   reset,
 *   containerRef,
 *   shouldAutoScroll
 * } = useInfiniteScroll(fetchChatFunction, sendMessageFunction);
 */
export const useInfiniteScroll = (fetchFunction, onSendMessage, initialPageSize = 20) => {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const pageSize = Math.min(initialPageSize, 100);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const loadPreviousMessages = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      // Store current scroll position before loading
      if (containerRef.current) {
        scrollPositionRef.current = containerRef.current.scrollHeight;
      }

      const response = await fetchFunction(page, pageSize);
      
      // Handle PaginatedResponse format - messages are in reverse chronological order
      const newMessages = response.data || response;
      const totalPages = response.totalPages !== undefined ? response.totalPages : 1;

      // Prepend new messages (they're older)
      setMessages((prev) => [...newMessages, ...prev]);
      setHasMore(page + 1 < totalPages);
      setPage((prev) => prev + 1);

      // Restore scroll position after new messages are loaded
      setTimeout(() => {
        if (containerRef.current) {
          const scrollDifference = containerRef.current.scrollHeight - scrollPositionRef.current;
          containerRef.current.scrollTop += scrollDifference;
        }
      }, 0);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      console.error('Infinite scroll error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction]);

  const sendMessage = useCallback(async (messageData) => {
    if (onSendMessage) {
      try {
        const newMessage = await onSendMessage(messageData);
        
        // Add new message to the end (newest)
        setMessages((prev) => [...prev, newMessage]);
        
        // Auto-scroll to bottom for new messages
        setTimeout(() => {
          if (containerRef.current && shouldAutoScroll) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 0);
        
        return newMessage;
      } catch (err) {
        setError(err.message || 'Failed to send message');
        throw err;
      }
    }
  }, [onSendMessage, shouldAutoScroll]);

  const reset = useCallback(() => {
    setMessages([]);
    setPage(0);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setShouldAutoScroll(true);
  }, []);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);

      // Load more when scrolling to top
      if (scrollTop < 100 && hasMore && !loading) {
        loadPreviousMessages();
      }
    }
  }, [hasMore, loading, loadPreviousMessages]);

  // Load first page on mount
  useEffect(() => {
    loadPreviousMessages();
  }, []);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadPreviousMessages,
    sendMessage,
    reset,
    containerRef,
    shouldAutoScroll,
    handleScroll
  };
};
