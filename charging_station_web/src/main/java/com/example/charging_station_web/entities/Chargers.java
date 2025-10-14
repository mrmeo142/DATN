package com.example.charging_station_web.entities;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "Chargers")
@Data
@AllArgsConstructor
public class Chargers {
    @Id
    private ObjectId id;
    private String mngId;
    private Double voltage;
    private Double temperature;
    private Double percenatge;
    private Double current;
    private String status;
    private String process;
}
