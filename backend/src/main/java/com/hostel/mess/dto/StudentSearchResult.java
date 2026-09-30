package com.hostel.mess.dto;

public record StudentSearchResult(
        String id,
        String displayName,
        String hostel,
        String roomNumber,
        String relationshipStatus,
        String friendshipId) {

}
