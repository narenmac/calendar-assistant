package com.calendarassistant.backend.controller;

import com.calendarassistant.backend.model.ErrorResponse;
import com.calendarassistant.backend.model.ScheduleRequest;
import com.calendarassistant.backend.model.ScheduleResponse;
import com.calendarassistant.backend.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping("/schedule")
    public ResponseEntity<?> schedule(@RequestBody ScheduleRequest request) {
        if (request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("text is required"));
        }
        if (request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("access_token is required"));
        }
        return ResponseEntity.ok(scheduleService.schedule(request));
    }

    @GetMapping("/events")
    public ResponseEntity<?> events(@RequestHeader("X-Google-Access-Token") String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("X-Google-Access-Token header is required"));
        }
        return ResponseEntity.ok(scheduleService.listEvents(accessToken));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("Unhandled error", ex);
        return ResponseEntity.internalServerError()
                .body(new ErrorResponse("Something went wrong: " + ex.getMessage()));
    }
}
