package com.example.charging_station_web.controllers;

import org.springframework.web.bind.annotation.RestController;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.entities.Chargers;
import com.example.charging_station_web.entities.TokenBlackList;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.entities.Vehicles;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.PromRepositories;
import com.example.charging_station_web.repositories.TokenBlacklist;
import com.example.charging_station_web.repositories.VehicleRepository;
import com.example.charging_station_web.services.UserServices;

import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;

@RestController

public class UsersControllers {

    private final UserServices userServices;
    private final VehicleRepository vehicleRepository;
    private final ChargerRepositories chargerRepositories;
    private final PasswordEncoder passwordEncoder;
    private final PromRepositories promRepositories;
    private final TokenBlacklist tokenBlacklist;

    public UsersControllers(UserServices userServices, VehicleRepository vehicleRepository,
            ChargerRepositories chargerRepositories, PasswordEncoder passwordEncoder,
            PromRepositories promRepositories, TokenBlacklist tokenBlacklist) {
        this.userServices = userServices;
        this.vehicleRepository = vehicleRepository;
        this.chargerRepositories = chargerRepositories;
        this.passwordEncoder = passwordEncoder;
        this.promRepositories = promRepositories;
        this.tokenBlacklist = tokenBlacklist;
    }

    // lay user qua email tu tocken (done)
    private Users getUserFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        String email = JwtUtil.extractEmail(token);

        Users user = userServices.getUsersbyEmail(email);
        return user;
    }

    // create user (done)
    @PostMapping("/create")
    public ResponseEntity<?> addUsers(@RequestBody Users user) {
        // Kiểm tra mật khẩu
        if (user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password must be at least 6 characters"));
        }

        // Kiểm tra email hợp lệ
        if (user.getEmail() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is required"));
        }

        if (!user.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid email format"));
        }

        // Kiểm tra email đã tồn tại
        if (userServices.getUsersbyEmail(user.getEmail()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already exists"));
        }

        // Lưu user mới
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(0);
        user.setAuthorization(false);
        user.setVehicles(new ArrayList<>());
        user.setBalance(0.0);
        Users savedUser = userServices.saveUsers(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedUser);
    }

    // login user (done)
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String rawPassword = loginRequest.get("password");

        Users existingUser = userServices.getUsersbyEmail(email);
        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
        }

        if (!passwordEncoder.matches(rawPassword, existingUser.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid password"));
        }

        String token = JwtUtil.generateToken(existingUser.getEmail());
        return ResponseEntity.ok(Map.of("token", token));
    }

    // get an user (done)
    @GetMapping("/profile")
    public ResponseEntity<?> getUser(HttpServletRequest request) {
        try {
            Users user = getUserFromToken(request);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // get user by id (for admin) (done)
    @GetMapping("/profile/{userId}")
    public ResponseEntity<?> getUserById(HttpServletRequest request, @PathVariable String userId) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            Users user = userServices.getUsersbyId(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // update user (done)
    @PutMapping("/update")
    public ResponseEntity<?> updateUser(HttpServletRequest request, @RequestBody Users user) {
        System.out.println("DEBUG: Entering /update endpoint");
        try {
            Users update = getUserFromToken(request);
            if (update == null) {
                System.out.println("DEBUG: User not found from token");
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            System.out.println("DEBUG: Found user: " + update.getEmail());
            System.out.println("DEBUG: Request body email: " + user.getEmail());

            if (user.getFullname() != null)
                update.setFullname(user.getFullname());

            // Nếu email gửi lên khác với email hiện tại, cần kiểm tra xem email mới đã tồn
            // tại chưa
            if (user.getEmail() != null && !user.getEmail().equals(update.getEmail())) {
                if (userServices.getUsersbyEmail(user.getEmail()) != null) {
                    System.out.println("DEBUG: Email already exists");
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Email already exists"));
                }
                update.setEmail(user.getEmail());
            }

            if (user.getIdentification() != null)
                update.setIdentification(user.getIdentification());
            if (user.getPhone() != null)
                update.setPhone(user.getPhone());
            if (user.getBirthday() != null)
                update.setBirthday(user.getBirthday());
            if (user.getPassword() != null && user.getPassword().length() >= 6)
                update.setPassword(passwordEncoder.encode(user.getPassword()));

            Users savedUser = userServices.saveUsers(update);
            System.out.println("DEBUG: Update success");
            return ResponseEntity.ok(savedUser);

        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Get all users (for admin) (done)
    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers(HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            List<Users> users = userServices.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Delete user (admin only) (done)
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable String userId, HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }

            Users user = userServices.getUsersbyId(userId);
            if (user != null) {
                userServices.deleteUserById(user.getId());
                return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Logout (done)
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                Date expiry = JwtUtil.getExpiration(token); 
                TokenBlackList blacklistedToken = new TokenBlackList(token, expiry);
                tokenBlacklist.save(blacklistedToken);
            }
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Logout failed"));
        }
    }

    // add vehicle (done)
    @PostMapping("/add/vehicles")
    public ResponseEntity<?> addVehicle(HttpServletRequest request, @RequestBody Vehicles vehicle) {
        try {
            Users addvehicle = getUserFromToken(request);
            if (vehicle.getIdentifier() != null) {
                String cleanedPlate = vehicle.getIdentifier().replaceAll("[\\s-.]", "");
                vehicle.setIdentifier(cleanedPlate);
            }
            Users user = userServices.addVehicleToUser(addvehicle.getId(), vehicle);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // update vehicle (done)
    @PutMapping("/update/vehicles/{vehicleId}")
    public ResponseEntity<?> updateVehicle(
            HttpServletRequest request,
            @PathVariable String vehicleId,
            @RequestBody Vehicles vehicle) {
        try {
            Users user = getUserFromToken(request);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            for (Vehicles v : user.getVehicles()) {
                if (v.getId().equals(vehicleId)) {
                    if (vehicle.getType() != null)
                        v.setType(vehicle.getType());
                    if (vehicle.getIdentifier() != null) {
                        String cleanedPlate = vehicle.getIdentifier().replaceAll("[-.]", "");
                        v.setIdentifier(cleanedPlate);
                    }
                    userServices.saveUsers(user);
                    vehicleRepository.save(v);
                }
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Vehicle not found"));
        }
    }

    // delete vehicle (done)
    @DeleteMapping("/delete/vehicles/{vehicleId}")
    public ResponseEntity<?> deleteVehicle(
            @PathVariable String vehicleId,
            HttpServletRequest request) {
        try {
            Users user = getUserFromToken(request);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }
            user.getVehicles().removeIf(st -> st.getId().equals(vehicleId));
            userServices.saveUsers(user);
            userServices.deleteVehicleById(vehicleId);
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Vehicle not found"));
        }
    }

    // get all vehicles (for admin) (done)
    @GetMapping("/vehicles")
    public ResponseEntity<?> getAllVehicles(HttpServletRequest request) {
        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) { // Chỉ admin
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            List<Vehicles> vehicles = userServices.getAllVehicles();
            return ResponseEntity.ok(vehicles);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // get vehicle by id (done)
    @GetMapping("/vehicles/{vehicleId}")
    public ResponseEntity<?> getVehicleById(HttpServletRequest request, @PathVariable String vehicleId) {
        try {
            Users user = getUserFromToken(request);
            Vehicles v = userServices.getVehiclebyId(vehicleId);
            if (v.getUserId().equals(user.getId()))
                return ResponseEntity.ok(v);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Vehicle not found"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // delete manager (for admin) (done)
    @PutMapping("delete/manager/{userId}")
    public ResponseEntity<?> deleteManager(@PathVariable String userId, HttpServletRequest request) {

        try {
            Users currentUser = getUserFromToken(request);
            if (currentUser.getRole() != 1) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied: Admin only"));
            }
            Users user = userServices.getUsersbyId(userId);
            if (user != null) {
                user.setRole(0);
                List<String> stations = user.getStations();
                if (stations == null || stations.isEmpty()) {
                    promRepositories.deleteByUserId(userId);
                    userServices.saveUsers(user);
                    return ResponseEntity.status(HttpStatus.ACCEPTED)
                            .body(Map.of("message", "Deleted successfully"));
                }
                for (String st : stations) {
                    Chargers chg = chargerRepositories.findById(st)
                            .orElseThrow(() -> new RuntimeException("Charger not found"));
                    chg.setProcess("unprocessed");
                    chargerRepositories.save(chg);
                }
                user.getStations().clear();
                promRepositories.deleteByUserId(userId);
                userServices.saveUsers(user);
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(Map.of("message", "Deleted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
