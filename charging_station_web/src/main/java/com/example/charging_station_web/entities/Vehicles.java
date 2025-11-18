package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "Vehicles")
@Data
@AllArgsConstructor
public class Vehicles {
    @Id
    private String id;
    private String userId;
    private String type;
    private String identifier;

}
