package com.calendarassistant.gcalmcp.config;

import com.calendarassistant.gcalmcp.tools.CalendarTools;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class McpToolConfig {

    private final CalendarTools calendarTools;

    /**
     * Exposes CalendarTools @Tool methods as MCP tools.
     * McpServerAutoConfiguration picks up ToolCallbackProvider beans automatically
     * and registers them via the SSE transport.
     */
    @Bean
    public ToolCallbackProvider calendarToolCallbackProvider() {
        return MethodToolCallbackProvider.builder()
                .toolObjects(calendarTools)
                .build();
    }
}
