package com.example.charging_station_web.controllers;

import com.example.charging_station_web.services.BillServices;
import com.example.charging_station_web.services.MQTTService;
import com.example.charging_station_web.services.UserServices;
import com.example.charging_station_web.entities.Vehicles;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadController {

    @Autowired
    private BillServices billServices;

    @Autowired
    private MQTTService mqttService;

    @Autowired
    private UserServices userServices;

    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/upload/{chargerId}")
    public ResponseEntity<Map<String, Object>> upload(
            @PathVariable String chargerId,
            @RequestBody Map<String, Object> data) {

        Map<String, Object> response = new HashMap<>();

        try {
            String imageBase64 = (String) data.get("image");
            if (imageBase64 == null || imageBase64.isBlank()) {
                response.put("success", false);
                response.put("error", "Không có ảnh gửi lên");
                return ResponseEntity.badRequest().body(response);
            }

            byte[] imageBytes = Base64.getDecoder().decode(imageBase64.replaceAll("\\s", ""));

            // Gửi sang server AI
            String url = "http://192.168.0.101:8000/detect/" + chargerId;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return chargerId + ".jpg";
                }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // RestTemplate với timeout
            RestTemplate restTemplate = new RestTemplate();
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(8000);  
            factory.setReadTimeout(15000);   
            restTemplate.setRequestFactory(factory);

            try {
                ResponseEntity<String> aiResponse = restTemplate.exchange(
                        url, HttpMethod.POST, requestEntity, String.class);

                Map<String, Object> aiResult = mapper.readValue(aiResponse.getBody(), new TypeReference<>() {});
                List<String> plates = mapper.convertValue(aiResult.get("plates"), new TypeReference<List<String>>() {});
                String plate = (plates != null && !plates.isEmpty()) ? plates.get(0).trim() : "";

                Vehicles vehicle = userServices.getVehicleByIdentifier(plate);

                if (vehicle != null && vehicle.getUserId() != null) {
                    billServices.createElecBill(vehicle.getUserId(), chargerId, vehicle.getId());
                    response.put("success", true);
                    response.put("chargerId", chargerId);
                    response.put("plate", plate);
                    System.out.println("ChargerId: " + chargerId + ", Plate: " + plate + ", UserId: " + vehicle.getUserId());

                    return ResponseEntity.ok(response);
                } else {
                    mqttService.sendCaptureCommand(chargerId, "capture");
                    response.put("success", false);
                    response.put("message", "Xe chưa đăng ký");
                    return ResponseEntity.ok(response);
                }

            } catch (HttpStatusCodeException e) {
                
                String errorMsg = "Server AI lỗi " + e.getStatusCode() + ": " + e.getResponseBodyAsString();
                System.err.println(errorMsg);

                mqttService.sendCaptureCommand(chargerId, "capture");
                response.put("success", false);
                response.put("error", "Nhận diện thất bại – chụp lại");
                return ResponseEntity.status(200).body(response); 

            } catch (ResourceAccessException e) {
                // Timeout hoặc không kết nối được Python server
                System.err.println("Không kết nối được server AI: " + e.getMessage());

                mqttService.sendCaptureCommand(chargerId, "capture");
                response.put("success", false);
                response.put("error", "Server nhận diện đang offline – chụp lại");
                return ResponseEntity.status(200).body(response);

            } catch (Exception e) {
                // Mọi lỗi khác (JSON sai, decode lỗi, v.v.)
                e.printStackTrace();
                response.put("success", false);
                response.put("error", "Lỗi xử lý ảnh");
                return ResponseEntity.status(200).body(response);
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "Lỗi server: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}