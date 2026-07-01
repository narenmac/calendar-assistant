package com.calendarassistant.gcalmcp.tools;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CalendarTools {

    private static final String APP_NAME = "Calendar Assistant";

    @Tool(description = "Create a Google Calendar event for the authenticated user")
    public String createEvent(
            @ToolParam(description = "Event title or summary") String summary,
            @ToolParam(description = "Start date-time in ISO-8601 format, e.g. 2024-07-01T14:00:00Z") String start,
            @ToolParam(description = "End date-time in ISO-8601 format, e.g. 2024-07-01T14:30:00Z") String end,
            @ToolParam(description = "Google OAuth2 access token for the authenticated user") String accessToken,
            @ToolParam(description = "Optional event description or agenda", required = false) String description
    ) {
        log.info("Creating event: summary={}, start={}, end={}", summary, start, end);
        try {
            Calendar service = buildCalendarService(accessToken);

            Event event = new Event()
                    .setSummary(summary)
                    .setDescription(description);

            event.setStart(new EventDateTime()
                    .setDateTime(new DateTime(start))
                    .setTimeZone("UTC"));
            event.setEnd(new EventDateTime()
                    .setDateTime(new DateTime(end))
                    .setTimeZone("UTC"));

            Event created = service.events().insert("primary", event).execute();
            log.info("Event created: id={}", created.getId());

            return String.format(
                    "{\"id\":\"%s\",\"summary\":\"%s\",\"start\":\"%s\",\"end\":\"%s\",\"htmlLink\":\"%s\"}",
                    created.getId(), created.getSummary(),
                    created.getStart().getDateTime(),
                    created.getEnd().getDateTime(),
                    created.getHtmlLink()
            );
        } catch (Exception e) {
            log.error("Failed to create event", e);
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    @Tool(description = "List upcoming Google Calendar events for the authenticated user")
    public String listEvents(
            @ToolParam(description = "Google OAuth2 access token for the authenticated user") String accessToken,
            @ToolParam(description = "Maximum number of events to return (default 10)", required = false) String maxResults,
            @ToolParam(description = "Lower bound for event start time in ISO-8601 format. Defaults to now.", required = false) String timeMin
    ) {
        int limit = 10;
        if (maxResults != null && !maxResults.isBlank()) {
            try { limit = Integer.parseInt(maxResults.trim()); } catch (NumberFormatException ignored) {}
        }
        log.info("Listing events: maxResults={}", limit);
        try {
            Calendar service = buildCalendarService(accessToken);

            String timeMinValue = (timeMin != null && !timeMin.isBlank())
                    ? timeMin
                    : Instant.now().toString();

            Events events = service.events().list("primary")
                    .setMaxResults(limit)
                    .setTimeMin(new DateTime(timeMinValue))
                    .setOrderBy("startTime")
                    .setSingleEvents(true)
                    .execute();

            List<Map<String, String>> result = new ArrayList<>();
            for (Event e : events.getItems()) {
                Map<String, String> entry = new HashMap<>();
                entry.put("id",      e.getId());
                entry.put("summary", e.getSummary() != null ? e.getSummary() : "(No title)");
                entry.put("start",   e.getStart().getDateTime() != null
                        ? e.getStart().getDateTime().toString()
                        : e.getStart().getDate().toString());
                entry.put("end",     e.getEnd().getDateTime() != null
                        ? e.getEnd().getDateTime().toString()
                        : e.getEnd().getDate().toString());
                result.add(entry);
            }

            log.info("Found {} events", result.size());
            return result.toString();
        } catch (Exception e) {
            log.error("Failed to list events", e);
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    /**
     * Builds a Google Calendar client from the user's access token.
     * Never stores credentials — creates a fresh client per call.
     */
    private Calendar buildCalendarService(String accessToken) throws Exception {
        GoogleCredentials credentials = GoogleCredentials.create(
                new AccessToken(accessToken, null)
        );
        return new Calendar.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials)
        )
        .setApplicationName(APP_NAME)
        .build();
    }
}
