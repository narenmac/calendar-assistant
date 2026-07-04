package com.calendarassistant.backend.service;

import com.calendarassistant.backend.model.ScheduleRequest;
import com.calendarassistant.backend.model.ScheduleResponse;
import com.calendarassistant.backend.model.ScheduleRequest.ChatMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.spec.McpSchema.Implementation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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

        // Build conversation history so the LLM has full context across turns
        List<Message> history = new ArrayList<>();
        if (request.getMessages() != null) {
            for (ChatMessage m : request.getMessages()) {
                if ("user".equals(m.getRole())) {
                    history.add(new UserMessage(m.getText()));
                } else if ("assistant".equals(m.getRole())) {
                    history.add(new AssistantMessage(m.getText()));
                }
            }
        }

        try (McpSyncClient mcpClient = createMcpClient()) {
            String reply = chatClient.prompt()
                    .system(systemPrompt)
                    .messages(history)
                    .user(request.getText())
                    .toolCallbacks(new SyncMcpToolCallbackProvider(List.of(mcpClient)))
                    .call()
                    .content();
            return new ScheduleResponse(reply);
        }
    }

    public ScheduleResponse listEvents(String accessToken) {
        // Bypass the LLM entirely — call the MCP tool directly to avoid burning TPM quota
        try (McpSyncClient mcpClient = createMcpClient()) {
            var result = mcpClient.callTool(new McpSchema.CallToolRequest(
                    "listEvents", Map.of("accessToken", accessToken, "maxResults", "10")));

            String json = result.content().stream()
                    .filter(c -> c instanceof McpSchema.TextContent)
                    .map(c -> ((McpSchema.TextContent) c).text())
                    .findFirst()
                    .orElse("[]");

            return new ScheduleResponse(formatEventList(json));
        } catch (Exception e) {
            log.error("Failed to list events directly", e);
            return new ScheduleResponse("Could not load events: " + e.getMessage());
        }
    }

    private String formatEventList(String json) {
        try {
            var events = new ObjectMapper().readValue(json,
                    new TypeReference<List<Map<String, String>>>() {});
            if (events.isEmpty()) return "No upcoming events.";

            var timeFmt = DateTimeFormatter.ofPattern("MMM d, h:mm a");
            var dateFmt = DateTimeFormatter.ofPattern("MMM d");
            var sb = new StringBuilder();
            for (var e : events) {
                String summary = e.getOrDefault("summary", "(No title)");
                String start   = e.getOrDefault("start", "");
                String display = "";
                if (!start.isEmpty()) {
                    try {
                        // timed event: "2026-07-04T14:00:00.000Z"
                        display = " — " + ZonedDateTime.parse(start).format(timeFmt);
                    } catch (Exception ex1) {
                        try {
                            // all-day event: "2026-07-04"
                            display = " — " + LocalDate.parse(start).format(dateFmt);
                        } catch (Exception ex2) {
                            display = " — " + start;
                        }
                    }
                }
                sb.append("• ").append(summary).append(display).append("\n");
            }
            return sb.toString().trim();
        } catch (Exception ex) {
            log.warn("Could not parse event list JSON, returning raw", ex);
            return json;
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

                Rules for CREATING events (createEvent tool):
                - NEVER call createEvent unless the user provides BOTH a specific date AND a specific time.
                - If the date is missing, ask: "What date should I schedule this for?"
                - If the time is missing, ask: "What time should I schedule this for?"
                - Do NOT assume or guess a date or time. Do NOT use defaults like "2 PM" or "tomorrow".
                - Default meeting duration is 30 minutes when not specified.
                - Parse relative dates like "tomorrow", "next Tuesday" relative to today's date.
                - After creating an event, confirm the title, date, and time to the user.

                Rules for LISTING events (listEvents tool):
                - Call listEvents immediately when the user asks to see their calendar, schedule, or events.
                - Do NOT ask for a date or time before listing — just call the tool right away.

                General:
                - Keep responses concise and friendly.
                """.formatted(now, accessToken);
    }
}
