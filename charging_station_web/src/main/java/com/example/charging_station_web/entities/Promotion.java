package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

import org.bson.types.ObjectId;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "Promotions")
@Data
@AllArgsConstructor
public class Promotion {
    @Id
    private ObjectId id;
    private String userId;
    private LocalDate startDate;
    private LocalDate approvedDate;
    private String adminId;
    private String status;
}
