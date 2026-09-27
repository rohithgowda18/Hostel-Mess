import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Paginated list loading with a Load More button.
 * Ported from temp-save-before-pull (chat-pagination-message-windowing).
 * Expects fetchFunction(page, pageSize) resolving to a PaginatedResponse
 * ({data, totalPages, totalElements}) or a plain array.
 *
 * Usage:
 * const { items, loading, error, hasMore, loadMore, reset, totalItems } =
 *   usePagination((page, size) => messApi.getMessages('GROUP', id, page, size), 20);
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
 * Infinite-scroll chat history (newest last, prepend older pages).
 * Ported from temp-save-before-pull (chat-pagination-message-windowing).
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
      if (containerRef.current) {
        scrollPositionRef.current = containerRef.current.scrollHeight;
      }

      const response = await fetchFunction(page, pageSize);

      const newMessages = response.data || response;
      const totalPages = response.totalPages !== undefined ? response.totalPages : 1;

      setMessages((prev) => [...newMessages, ...prev]);
      setHasMore(page + 1 < totalPages);
      setPage((prev) => prev + 1);

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

        setMessages((prev) => [...prev, newMessage]);

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

  const appendLiveMessage = useCallback((message) => {
    setMessages((prev) => {
      if (prev.some((m) => (m.id || m._id) && (m.id || m._id) === (message.id || message._id))) {
        return prev;
      }
      return [...prev, message];
    });
    setTimeout(() => {
      if (containerRef.current && shouldAutoScroll) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 0);
  }, [shouldAutoScroll]);

  const reset = useCallback(() => {
    setMessages([]);
    setPage(0);
    setLoading(false);
    setError(null);
    setHasMore(true);
    setShouldAutoScroll(true);
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);

      if (scrollTop < 100 && hasMore && !loading) {
        loadPreviousMessages();
      }
    }
  }, [hasMore, loading, loadPreviousMessages]);

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
    appendLiveMessage,
    reset,
    containerRef,
    shouldAutoScroll,
    handleScroll
  };
};
