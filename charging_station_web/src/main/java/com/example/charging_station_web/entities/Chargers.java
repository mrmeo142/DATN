package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "Chargers")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Chargers {
    @Id
    private String id;
    private String mngId;
    private String status;
    private String process;
}
