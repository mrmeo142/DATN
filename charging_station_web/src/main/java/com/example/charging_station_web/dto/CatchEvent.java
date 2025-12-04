package com.example.charging_station_web.dto;
import org.springframework.context.ApplicationEvent;

public class CatchEvent extends ApplicationEvent {
    private final String billId;
    private final String reason;

    public CatchEvent(String billId, String reason) {
        super(billId);
        this.billId = billId;
        this.reason = reason;
    }

    public String getBillId() {
        return billId;
    }
    
    public String getReason() {
        return reason;
    }
}

