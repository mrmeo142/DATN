package com.example.charging_station_web.entities;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

@Document(collection = "BankAccount")
@Data
@AllArgsConstructor
public class BankAccount {
    @Id
    private ObjectId id;
    private String userId;
    private String bankId;
    private String accountNumber;
    private String accountHolderName;
    private String bankName;
    private Double balance;
}
