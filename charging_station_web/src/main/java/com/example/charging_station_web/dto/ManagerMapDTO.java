package com.example.charging_station_web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Getter
public class ManagerMapDTO {
    private String managerId;         
    private String address;
    private Double latitude;          
    private Double longitude;        
}