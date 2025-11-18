package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;


@Document(collection = "Users")
@Data
@AllArgsConstructor
public class Users {
    @Id
    private String id;
    private String username;
    private String fullname;
    private String email;
    private String password;
    private String identification;
    private String phone;
    private Boolean authorization;
    private LocalDate birthday;
    private Integer role = 0 ; // 0: user, 1: admin, 2: manager
    private ArrayList<Vehicles> vehicles = new ArrayList<>();
    private Double balance = 0.0;
    private ArrayList<String> stations = new ArrayList<>();
}

