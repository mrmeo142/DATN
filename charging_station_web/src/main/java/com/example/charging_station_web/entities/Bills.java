package com.example.charging_station_web.entities;

import java.time.LocalDateTime;
import java.util.ArrayList;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "Bills")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Bills {
    @Id
    private String id;
    private String userId;
    private BillType billType;
    private Double amount;
    private Boolean paid = false;
    private String description;
    private LocalDateTime paidAt;
    
    // ELECTRIC
    private String chargerId;
    private String managerId;
    private String vehicleId;
    private LocalDateTime createdAt;
    private LocalDateTime pauseAt;
    private String userName;
    private String submitType;
    private ArrayList<Session> timeUse = new ArrayList<>();
    
    // BANK
    private String bankAccountId;
    private String cardNumber;
    private String cardHolderName;
    private String bankName;

    public Double getTotalTime() {
        Double hours = 0.0;
        if (timeUse != null) {
            for (Session session : timeUse) {
                if (session.getEndedAt() != null && session.getStartedAt()!= null) {
                    hours += session.getDuration();
                }
            }
        }
        return hours;
    }

    public void addSession(Session s){
        timeUse.add(s);
    }
}

