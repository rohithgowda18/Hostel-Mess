package com.hostel.mess.repository;

import com.hostel.mess.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

/**
 * MongoDB Repository for ChatMessage
 * Provides custom query methods for fetching messages
 */
@Repository
public interface ChatRepository extends MongoRepository<ChatMessage, String> {
    
    /**
     * Find all messages for a specific chat (by chatType and chatId)
     * Ordered by creation time ascending
     * 
     * @param chatType GROUP or UNIVERSAL
     * @param chatId groupId for GROUP, "GLOBAL" for UNIVERSAL
     * @return List of chat messages
     */
    List<ChatMessage> findByChatTypeAndChatIdOrderByCreatedAtAsc(String chatType, String chatId);
    
    /**
     * Find all non-expired messages for a specific chat
     * 
     * @param chatType GROUP or UNIVERSAL
     * @param chatId groupId for GROUP, "GLOBAL" for UNIVERSAL
     * @param now Current timestamp
     * @return List of non-expired messages
     */
    @Query("{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }")
    List<ChatMessage> findNonExpiredByChatTypeAndChatId(String chatType, String chatId, Instant now);
    
    /**
     * Find all non-expired messages for a specific chat, ordered by creation time
     * 
     * @param chatType GROUP or UNIVERSAL
     * @param chatId groupId for GROUP, "GLOBAL" for UNIVERSAL
     * @param now Current timestamp
     * @return List of non-expired messages ordered by creation time
     */
    @Query(value = "{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }", sort = "{ 'createdAt': 1 }")
    List<ChatMessage> findNonExpiredByChatTypeAndChatIdSorted(String chatType, String chatId, Instant now);
    
    /**
     * Find messages sent by a specific user in a chat
     * 
     * @param senderId User ID
     * @param chatType GROUP or UNIVERSAL
     * @param chatId groupId for GROUP, "GLOBAL" for UNIVERSAL
     * @return List of messages from user
     */
    List<ChatMessage> findBySenderIdAndChatTypeAndChatId(String senderId, String chatType, String chatId);
    
    /**
     * Count messages in a chat that are not expired
     * 
     * @param chatType GROUP or UNIVERSAL
     * @param chatId groupId for GROUP, "GLOBAL" for UNIVERSAL
     * @param now Current timestamp
     * @return Number of non-expired messages
     */
    @Query("{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }")
    long countNonExpiredByChatTypeAndChatId(String chatType, String chatId, Instant now);
}
