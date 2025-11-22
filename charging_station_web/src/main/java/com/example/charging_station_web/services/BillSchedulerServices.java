package com.example.charging_station_web.services;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import com.example.charging_station_web.entities.Bills;
import com.example.charging_station_web.entities.Users;

@Service
public class BillSchedulerServices {

    private final TaskScheduler taskScheduler;
    private final BillServices billServices;
    private final EmailService emailService;
    private final UserServices userServices;

    public BillSchedulerServices (TaskScheduler taskScheduler, BillServices billServices,
                                  EmailService emailService, UserServices userServices){
        this.billServices = billServices;
        this.taskScheduler = taskScheduler;
        this.emailService = emailService;
        this.userServices = userServices;
    }

    // Map để quản lý task theo billId
    private final Map<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();

    // Lập lịch auto-payment sau 10 phút
    public void scheduleAutoPayment(String billId) {

        // Huỷ task cũ nếu đã có
        ScheduledFuture<?> oldTask = scheduledTasks.get(billId);
        if (oldTask != null && !oldTask.isDone()) {
            oldTask.cancel(false);
        }

        // Lên lịch 15 phút sau
        ScheduledFuture<?> future = taskScheduler.schedule(() -> {
            Bills bill = billServices.findBillById(billId);

            // Kiểm tra trạng thái trước khi thanh toán
            if (bill.getPaid() == false && bill.getAction().equals("Stop")) {
                billServices.paidElecBill(billId);
                
                Double amount = bill.getAmount();
                Users currentUser = userServices.getUsersbyId(bill.getUserId());
                Locale vietnam = Locale.forLanguageTag("vi-VN");
                NumberFormat formatter = NumberFormat.getCurrencyInstance(vietnam);
                String amountVND = formatter.format(amount);
                String subject = "THÔNG BÁO THANH TOÁN HÓA ĐƠN THÀNH CÔNG";
                String content = "Xin chào " + currentUser.getFullname() + ",\n"
                        + "Hóa đơn: " + bill.getId() + " đã được thanh toán thành công.\n"
                        + "Số tiền: " + amountVND + ".\n"
                        + "Cảm ơn bạn đã sử dụng dịch vụ!";
                emailService.sendPaymentSuccessEmail(currentUser.getEmail(), subject, content);
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

