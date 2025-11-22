package com.example.charging_station_web.entities;
import org.springframework.context.ApplicationEvent;

public class OverAmountEvent extends ApplicationEvent {
    private final String billId;

    public OverAmountEvent(String billId) {
        super(billId);
        this.billId = billId;
    }

    public String getBillId() {
        return billId;
    }
}

