package com.calendarassistant.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ScheduleRequest {

    private String text;

    @JsonProperty("access_token")
    private String accessToken;
}
