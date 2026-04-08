package com.hostel.mess.events;

import com.hostel.mess.dto.ChatResponse;
import lombok.Getter;
import java.util.UUID;

/**
 * Event published when a chat message is sent
 */
@Getter
public class MessageSentEvent extends DomainEvent {
    private final String messageId;
    private final String chatType;
    private final String chatId;
    private final ChatResponse chatResponse;
    private final String senderName;

    public MessageSentEvent(Object source, String messageId, String chatType, String chatId, ChatResponse chatResponse, String senderName, String userId) {
        super(source, UUID.randomUUID().toString(), userId);
        this.messageId = messageId;
        this.chatType = chatType;
        this.chatId = chatId;
        this.chatResponse = chatResponse;
        this.senderName = senderName;
    }

    @Override
    public String getEventType() {
        return "MESSAGE_SENT";
    }
}
