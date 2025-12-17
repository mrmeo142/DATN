package com.example.charging_station_web.services;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.dto.CatchEvent;
import com.example.charging_station_web.entities.Bills;

@Service
public class BillSchedulerServices {

    private final TaskScheduler taskScheduler;
    private final BillServices billServices;

    public BillSchedulerServices (TaskScheduler taskScheduler, BillServices billServices){
        this.billServices = billServices;
        this.taskScheduler = taskScheduler;
    }

    // Map để quản lý task theo billId
    private final Map<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    @EventListener
    public void handleOverAmountEvent(CatchEvent event) {
        String billId = event.getBillId();
        cancelScheduledPayment(billId);
        scheduleAutoPayment(billId);
        System.out.println("OverAmountEvent received, bill " + billId + " scheduled for payment.");
    }
    // Lập lịch auto-payment
    public void scheduleAutoPayment(String billId) {

        // Huỷ task cũ nếu đã có
        ScheduledFuture<?> oldTask = scheduledTasks.get(billId);
        if (oldTask != null && !oldTask.isDone()) {
            oldTask.cancel(false);
        }

        // Lên lịch
        ScheduledFuture<?> future = taskScheduler.schedule(() -> {
            Bills bill = billServices.findBillById(billId);

            // Kiểm tra trạng thái trước khi thanh toán
            if (bill.getPaid() == false && bill.getAction().equals("Stop")) {
                billServices.paidElecBill(billId);
            }
            scheduledTasks.remove(billId);

        }, Instant.now().plus(Duration.ofMinutes(5)));

        scheduledTasks.put(billId, future);
    }

    public void cancelScheduledPayment(String billId) {
        ScheduledFuture<?> future = scheduledTasks.get(billId);
        if (future != null && !future.isDone()) {
            future.cancel(false);
            scheduledTasks.remove(billId);
            System.out.println("Auto-payment cancelled for bill " + billId);
        }
    }
}

