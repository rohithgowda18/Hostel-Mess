package com.hostel.mess.dto;

import java.util.List;

/**
 * Cursor-based paginated response for chat messages.
 * Ported from temp-save-before-pull for infinite-scroll chat history.
 *
 * Response format:
 * {
 *   "data": [...],
 *   "cursor": "timestamp:id",
 *   "hasMore": true,
 *   "limit": 20
 * }
 */
public class CursorPaginatedResponse<T> {

    private List<T> data;
    private String cursor;
    private boolean hasMore;
    private int limit;

    public CursorPaginatedResponse() {}

    public CursorPaginatedResponse(List<T> data, String cursor, boolean hasMore, int limit) {
        this.data = data;
        this.cursor = cursor;
        this.hasMore = hasMore;
        this.limit = limit;
    }

    public List<T> getData() {
        return data;
    }

    public String getCursor() {
        return cursor;
    }

    public boolean isHasMore() {
        return hasMore;
    }

    public int getLimit() {
        return limit;
    }

    public void setData(List<T> data) {
        this.data = data;
    }

    public void setCursor(String cursor) {
        this.cursor = cursor;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }
}
