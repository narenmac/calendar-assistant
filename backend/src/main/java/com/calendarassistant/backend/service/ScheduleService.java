package com.calendarassistant.backend.service;

import com.calendarassistant.backend.model.ScheduleRequest;
import com.calendarassistant.backend.model.ScheduleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ChatClient chatClient;
    private final ToolCallbackProvider mcpToolCallbackProvider;

    public ScheduleResponse schedule(ScheduleRequest request) {
        log.info("Processing schedule request: {}", request.getText());

        String systemPrompt = buildSystemPrompt(request.getAccessToken());

        String reply = chatClient.prompt()
                .system(systemPrompt)
                .user(request.getText())
                .toolCallbacks(mcpToolCallbackProvider)
                .call()
                .content();

        return new ScheduleResponse(reply);
    }

    public ScheduleResponse listEvents(String accessToken) {
        String systemPrompt = buildSystemPrompt(accessToken);

        String reply = chatClient.prompt()
                .system(systemPrompt)
                .user("List my upcoming calendar events for the next 7 days.")
                .toolCallbacks(mcpToolCallbackProvider)
                .call()
                .content();

        return new ScheduleResponse(reply);
    }

    private String buildSystemPrompt(String accessToken) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        return """
                You are a helpful Google Calendar scheduling assistant.
                Current date and time: %s

                The user's Google Calendar access token is: %s
                Always pass this exact value as the `accessToken` parameter when calling any calendar tool.

                Rules:
                - NEVER call a tool unless you have BOTH a specific date AND a specific time from the user.
                - If the user does not provide a date, ask: "What date should I schedule this for?"
                - If the user does not provide a time, ask: "What time should I schedule this for?"
                - Do NOT assume or guess a date or time. Do NOT use defaults like "2 PM" or "tomorrow".
                - Default meeting duration is 30 minutes when not specified.
                - Parse relative dates like "tomorrow", "next Tuesday" relative to today's date.
                - After creating an event, confirm the title, date, and time to the user.
                - Keep responses concise and friendly.
                """.formatted(now, accessToken);
    }
}
