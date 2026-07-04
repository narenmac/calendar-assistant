package com.calendarassistant.backend.service;

import com.calendarassistant.backend.model.ScheduleRequest;
import com.calendarassistant.backend.model.ScheduleResponse;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import io.modelcontextprotocol.spec.McpSchema.Implementation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class ScheduleService {

    private final ChatClient chatClient;
    private final String gcalMcpUrl;

    public ScheduleService(ChatClient chatClient,
                           @Value("${GCAL_MCP_URL:http://localhost:8090}") String gcalMcpUrl) {
        this.chatClient = chatClient;
        this.gcalMcpUrl = gcalMcpUrl;
    }

    public ScheduleResponse schedule(ScheduleRequest request) {
        log.info("Processing schedule request: {}", request.getText());

        String systemPrompt = buildSystemPrompt(request.getAccessToken());

        try (McpSyncClient mcpClient = createMcpClient()) {
            String reply = chatClient.prompt()
                    .system(systemPrompt)
                    .user(request.getText())
                    .toolCallbacks(new SyncMcpToolCallbackProvider(List.of(mcpClient)))
                    .call()
                    .content();
            return new ScheduleResponse(reply);
        }
    }

    public ScheduleResponse listEvents(String accessToken) {
        String systemPrompt = buildSystemPrompt(accessToken);

        try (McpSyncClient mcpClient = createMcpClient()) {
            String reply = chatClient.prompt()
                    .system(systemPrompt)
                    .user("List my upcoming calendar events for the next 7 days.")
                    .toolCallbacks(new SyncMcpToolCallbackProvider(List.of(mcpClient)))
                    .call()
                    .content();
            return new ScheduleResponse(reply);
        }
    }

    private McpSyncClient createMcpClient() {
        log.debug("Creating fresh MCP client for {}", gcalMcpUrl);
        var transport = HttpClientSseClientTransport.builder(gcalMcpUrl).build();
        McpSyncClient client = McpClient.sync(transport)
                .clientInfo(new Implementation("backend", "1.0.0"))
                .build();
        client.initialize();
        return client;
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
