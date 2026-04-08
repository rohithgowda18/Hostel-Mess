package com.hostel.mess.dto;

import java.util.List;

/**
 * Generic paginated response wrapper for list APIs
 * Used for all paginated list endpoints
 * 
 * Response format:
 * {
 *   "data": [...],
 *   "page": 1,
 *   "size": 20,
 *   "totalPages": 10,
 *   "totalElements": 200,
 *   "hasNext": true,
 *   "hasPrevious": false
 * }
 */
public class PaginatedResponse<T> {
    
    private List<T> data;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private boolean hasNext;
    private boolean hasPrevious;
    
    // Constructors
    public PaginatedResponse() {}
    
    public PaginatedResponse(List<T> data, int page, int size, int totalPages, long totalElements) {
        this.data = data;
        this.page = page;
        this.size = size;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.hasNext = page < totalPages;
        this.hasPrevious = page > 0;
    }
    
    // Factory methods for Spring Page objects
    public static <T> PaginatedResponse<T> fromPage(org.springframework.data.domain.Page<T> page) {
        return new PaginatedResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalPages(),
            page.getTotalElements()
        );
    }
    
    // Getters
    public List<T> getData() {
        return data;
    }
    
    public int getPage() {
        return page;
    }
    
    public int getSize() {
        return size;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public long getTotalElements() {
        return totalElements;
    }
    
    public boolean isHasNext() {
        return hasNext;
    }
    
    public boolean isHasPrevious() {
        return hasPrevious;
    }
    
    // Setters
    public void setData(List<T> data) {
        this.data = data;
    }
    
    public void setPage(int page) {
        this.page = page;
    }
    
    public void setSize(int size) {
        this.size = size;
    }
    
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
    
    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }
    
    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }
    
    public void setHasPrevious(boolean hasPrevious) {
        this.hasPrevious = hasPrevious;
    }
}
