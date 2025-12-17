package com.example.charging_station_web.services;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeocodingService {

    private static final String API_KEY = "AIzaSyAAH0hpXcjook5_ZxS_VhIACcXB8FYTZhI";
    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings({ "rawtypes", "unchecked" })
public LatLng getLatLngFromAddress(String address) {
    if (address == null || address.trim().isEmpty()) return null;

    String clean = removeVietnameseAccents(address)
            .replaceAll("Đường|\\.", " ")     
            .replaceAll("Phường|P\\.", " ")  
            .replaceAll("Quận|Q\\.", " ")    
            .replaceAll("Huyện", " ")
            .replaceAll("[^a-zA-Z0-9\\s,]", " ")
            .replaceAll("\\s+", " ")
            .trim();

    if (!clean.toLowerCase().contains("vietnam")) {
        clean = clean + ", Vietnam";
    }

    String url = "https://maps.googleapis.com/maps/api/geocode/json"
            + "?address=" + URLEncoder.encode(clean, StandardCharsets.UTF_8)
            + "&key=" + API_KEY
            + "&region=vn&language=vi";

    try {
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body != null) {
            String status = (String) body.get("status");

            if ("OK".equals(status) || "ZERO_RESULTS".equals(status) == false) {
                var results = (List<Map<String, Object>>) body.get("results");
                if (!results.isEmpty()) {
                    var location = (Map<String, Object>) 
                        ((Map<String, Object>) results.get(0).get("geometry")).get("location");
                    Double lat = (Double) location.get("lat");
                    Double lng = (Double) location.get("lng");
                    return new LatLng(lat, lng);
                }
            }
        }
    } catch (Exception e) {
        System.out.println("Lỗi mạng: " + e.getMessage());
    }
    return null;
}

    private String removeVietnameseAccents(String str) {
        if (str == null) return null;
        String result = str;
        String[] vietnamese = {"à","á","ạ","ả","ã","â","ầ","ấ","ậ","ẩ","ẫ","ă","ằ","ắ","ặ","ẳ","ẵ","è","é","ẹ","ẻ","ẽ","ê","ề","ế","ệ","ể","ễ","ì","í","ị","ỉ","ĩ","ò","ó","ọ","ỏ","õ","ô","ồ","ố","ộ","ổ","ỗ","ơ","ờ","ớ","ợ","ở","ỡ","ù","ú","ụ","ủ","ũ","ư","ừ","ứ","ự","ử","ữ","ỳ","ý","ỵ","ỷ","ỹ","đ","À","Á","Ạ","Ả","Ã","Â","Ầ","Ấ","Ậ","Ẩ","Ẫ","Ă","Ằ","Ắ","Ặ","Ẳ","Ẵ","È","É","Ẹ","Ẻ","Ẽ","Ê","Ề","Ế","Ệ","Ể","Ễ","Ì","Í","Ị","Ỉ","Ĩ","Ò","Ó","Ọ","Ỏ","Õ","Ô","Ồ","Ố","Ộ","Ổ","Ỗ","Ơ","Ờ","Ớ","Ợ","Ở","Ỡ","Ù","Ú","Ụ","Ủ","Ũ","Ư","Ừ","Ứ","Ự","Ử","Ữ","Ỳ","Ý","Ỵ","Ỷ","Ỹ","Đ"};
        String[] replace   = {"a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","a","e","e","e","e","e","e","e","e","e","e","e","i","i","i","i","i","o","o","o","o","o","o","o","o","o","o","o","o","o","o","o","o","o","u","u","u","u","u","u","u","u","u","u","u","y","y","y","y","y","d","A","A","A","A","A","A","A","A","A","A","A","A","A","A","A","A","A","E","E","E","E","E","E","E","E","E","E","E","I","I","I","I","I","O","O","O","O","O","O","O","O","O","O","O","O","O","O","O","O","O","U","U","U","U","U","U","U","U","U","U","U","Y","Y","Y","Y","Y","D"};
        
        for (int i = 0; i < vietnamese.length; i++) {
            result = result.replace(vietnamese[i], replace[i]);
        }
        return result;
    }

    public record LatLng(Double lat, Double lng) {}
}