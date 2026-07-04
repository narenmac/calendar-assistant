package com.calendarassistant.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ScheduleRequest {

    private String text;

    @JsonProperty("access_token")
    private String accessToken;

    /** Conversation history (all previous turns, excluding the current message) */
    private List<ChatMessage> messages;

    @Data
    public static class ChatMessage {
        private String role;  // "user" or "assistant"
        private String text;
    }
}
