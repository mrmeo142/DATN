package com.example.charging_station_web.services;

import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Price;
import com.example.charging_station_web.repositories.PriceRepositories;


@Service
public class PriceServices {

    private final PriceRepositories priceRepositories;

    public PriceServices(PriceRepositories priceRepositories) {
        this.priceRepositories = priceRepositories;
    }

    // save price
    public Price savePrice(Price price) {
        return priceRepositories.save(price);
    }

    // get price
    public Price getPrice() {
        return priceRepositories.findById("p1").orElse(null);
    }

}
