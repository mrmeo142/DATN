package com.example.charging_station_web.entities;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class MqttData {
    private String chargerId;
    private String billId;
    private Double current;
    private Double voltage;
    private Double temp;
}
