package com.hostel.mess.dto;

import java.time.Instant;
import java.util.List;

/**
 * Cursor-based paginated response for chat messages
 * Used for infinite scroll functionality in chat
 * 
 * Cursor-based pagination is more efficient for large datasets
 * and provides better user experience for real-time data
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
    private String cursor;  // Timestamp of last item for next query
    private boolean hasMore;
    private int limit;
    
    // Constructors
    public CursorPaginatedResponse() {}
    
    public CursorPaginatedResponse(List<T> data, String cursor, boolean hasMore, int limit) {
        this.data = data;
        this.cursor = cursor;
        this.hasMore = hasMore;
        this.limit = limit;
    }
    
    // Getters
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
    
    // Setters
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
