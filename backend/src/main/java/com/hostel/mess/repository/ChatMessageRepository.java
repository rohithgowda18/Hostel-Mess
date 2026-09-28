package com.hostel.mess.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.ChatMessage;

/**
 * MongoDB Repository for ChatMessage
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    long deleteByChatTypeAndCreatedAtBefore(String chatType, Instant cutoff);

    List<ChatMessage> findByChatTypeAndChatIdOrderByCreatedAtAsc(String chatType, String chatId);

    @Query("{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }")
    List<ChatMessage> findNonExpiredByChatTypeAndChatId(String chatType, String chatId, Instant now);

    @Query(value = "{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }", sort = "{ 'createdAt': 1 }")
    List<ChatMessage> findNonExpiredByChatTypeAndChatIdSorted(String chatType, String chatId, Instant now);

    @Query(value = "{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }", sort = "{ 'createdAt': -1 }")
    Page<ChatMessage> findNonExpiredByChatTypeAndChatIdPaged(String chatType, String chatId, Instant now, Pageable pageable);

    List<ChatMessage> findBySenderIdAndChatTypeAndChatId(String senderId, String chatType, String chatId);

    @Query("{ 'chatType': ?0, 'chatId': ?1, 'expiresAt': { '$gt': ?2 } }")
    long countNonExpiredByChatTypeAndChatId(String chatType, String chatId, Instant now);
}
