package com.example.charging_station_web;

import com.example.charging_station_web.config.JwtUtil;
import com.example.charging_station_web.controllers.UsersControllers;
import com.example.charging_station_web.entities.Users;
import com.example.charging_station_web.repositories.ChargerRepositories;
import com.example.charging_station_web.repositories.PromRepositories;
import com.example.charging_station_web.repositories.TokenBlacklist;
import com.example.charging_station_web.repositories.VehicleRepository;
import com.example.charging_station_web.services.UserServices;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import java.time.LocalDate;
import java.util.ArrayList;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UsersControllers.class)
@AutoConfigureMockMvc(addFilters = false)
class ChargingStationWebApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private UserServices userServices;

	@MockBean
	private VehicleRepository vehicleRepository;

	@MockBean
	private ChargerRepositories chargerRepositories;

	@MockBean
	private PasswordEncoder passwordEncoder;

	@MockBean
	private PromRepositories promRepositories;

	@MockBean
	private TokenBlacklist tokenBlacklist;

	@Test
	void updateUser_success() throws Exception {
		String email = "update@example.com";
		String token = JwtUtil.generateToken(email);

		Users existing = new Users(
				"u1",
				null,
				"Old Name",
				email,
				"oldpass",
				null,
				"0000000000",
				false,
				null,
				null,
				0,
				new ArrayList<>(),
				0.0,
				new ArrayList<>());

		Mockito.when(userServices.getUsersbyEmail(eq(email))).thenReturn(existing);
		Mockito.when(passwordEncoder.encode(eq("secret123"))).thenReturn("encoded-secret");

		Users saved = new Users(
				"u1",
				null,
				"New Name",
				"new@example.com",
				"encoded-secret",
				null,
				"0123456789",
				false,
				null,
				null,
				0,
				new ArrayList<>(),
				0.0,
				new ArrayList<>());

		Mockito.when(userServices.saveUsers(any(Users.class))).thenReturn(saved);

		String body = "{\n" +
				"  \"fullname\": \"New Name\",\n" +
				"  \"email\": \"new@example.com\",\n" +
				"  \"phone\": \"0123456789\",\n" +
				"  \"password\": \"secret123\"\n" +
				"}";

		mockMvc.perform(
				put("/update")
						.header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value("u1"))
				.andExpect(jsonPath("$.fullname").value("New Name"))
				.andExpect(jsonPath("$.email").value("new@example.com"))
				.andExpect(jsonPath("$.phone").value("0123456789"));
	}
}
