package com.example.charging_station_web.entities;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "Banks")
@Data
@AllArgsConstructor
public class Banks {
    @Id
    private ObjectId id;
    // private String adminId;
    private String bankName;
}
