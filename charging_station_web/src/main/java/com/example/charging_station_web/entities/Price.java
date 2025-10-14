package com.example.charging_station_web.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "Price")
public class Price {

    @Id
    private String id;
    private Double price;

    public Price(Double price) {
        this.id = "p1";
        this.price = price;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }
}
