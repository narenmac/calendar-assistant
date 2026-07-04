package com.calendarassistant.backend.config;

import com.calendarassistant.backend.tools.CalendarTools;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class ToolConfig {

    private final CalendarTools calendarTools;

    @Bean
    public ToolCallbackProvider calendarToolCallbackProvider() {
        return MethodToolCallbackProvider.builder()
                .toolObjects(calendarTools)
                .build();
    }
}
