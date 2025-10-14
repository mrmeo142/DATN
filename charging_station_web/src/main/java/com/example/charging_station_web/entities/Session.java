package com.example.charging_station_web.entities;
import java.time.Duration;
import java.time.LocalDateTime;

public class Session {

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    public Session(LocalDateTime startedAt, LocalDateTime endedAt) {
        this.startedAt = startedAt;
        this.endedAt = endedAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }
    
    public Double getDuration() {
        if (startedAt != null && endedAt != null) {
            return Duration.between(startedAt, endedAt).toMillis()/3600000.0;
        } else {
            return 0.0;
        }
    }
}
