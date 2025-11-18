package com.example.charging_station_web.controllers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadController {

    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestBody Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>();
        try {
            String chargerId = (String) data.get("chargerId");
            String imageBase64 = (String) data.get("image");
            if (imageBase64 == null || imageBase64.isEmpty())
                throw new RuntimeException("Không có ảnh gửi lên");

            byte[] imageBytes = Base64.getDecoder().decode(imageBase64);

            // Gửi sang server AI
            String url = "http://192.168.0.101:8000/detect";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() { return chargerId + ".jpg"; }
            });

            ResponseEntity<String> result = new RestTemplate()
                    .postForEntity(url, new HttpEntity<>(body, headers), String.class);

            Map<String, Object> flaskResp = mapper.readValue(result.getBody(), new TypeReference<>() {});

            // Type-safe conversion sang List<String>
            List<String> plates = mapper.convertValue(flaskResp.get("plates"), new TypeReference<List<String>>() {});
            String plate = (plates == null || plates.isEmpty()) ? "" : plates.get(0);

            // In ra chargerId + plate
            System.out.println("ChargerId: " + chargerId + ", Plate: " + plate);
            
            // tra ve phan hoi cho client
            response.put("success", true);
            response.put("chargerId", chargerId);
            response.put("plate", plate);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }
}
