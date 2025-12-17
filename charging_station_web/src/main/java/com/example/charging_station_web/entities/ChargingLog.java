package com.example.charging_station_web.entities;

import java.time.LocalDateTime;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "Log")
public class ChargingLog {
    @Id
    private ObjectId id;
    private String chargerId;
    private String billId;
    private LocalDateTime timestamp;
    private Double voltage;
    private Double current;
    private Double percentage;
}
