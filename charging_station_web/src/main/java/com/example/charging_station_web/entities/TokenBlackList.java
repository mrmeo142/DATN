package com.example.charging_station_web.entities;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
@Document(collection = "Token_blacklist")
public class TokenBlackList {
    @Id
    private String token;
    private Date expiry;
}
