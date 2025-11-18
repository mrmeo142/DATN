package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "Banks")
@Data
@AllArgsConstructor
public class Banks {
    @Id
    private String id;
    // private String adminId;
    private String bankName;
    private String avt;
}
