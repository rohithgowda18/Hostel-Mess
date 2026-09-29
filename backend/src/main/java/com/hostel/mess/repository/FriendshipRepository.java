package com.hostel.mess.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.hostel.mess.model.Friendship;

@Repository
public interface FriendshipRepository extends MongoRepository<Friendship, String> {

    @Query("{ '$or': [ { 'requesterId': ?0, 'receiverId': ?1 }, { 'requesterId': ?1, 'receiverId': ?0 } ] }")
    Optional<Friendship> findRelationship(String userIdA, String userIdB);

    @Query("{ 'status': 'ACCEPTED', '$or': [ { 'requesterId': ?0 }, { 'receiverId': ?0 } ] }")
    List<Friendship> findAcceptedFriends(String userId);

    List<Friendship> findByReceiverIdAndStatusOrderByCreatedAtDesc(String receiverId, String status);

    List<Friendship> findByRequesterIdAndStatusOrderByCreatedAtDesc(String requesterId, String status);

    @Query(value = "{ '$or': [ { 'requesterId': ?0, 'receiverId': ?1 }, { 'requesterId': ?1, 'receiverId': ?0 } ] }", delete = true)
    long deleteRelationship(String userIdA, String userIdB);
}
