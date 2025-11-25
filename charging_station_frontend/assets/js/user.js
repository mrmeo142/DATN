'use strict';

/* ===================== TOKEN & USER PROFILE ===================== */
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); // decode payload
        const now = Date.now() / 1000; // giây
        return payload.exp < now; // true nếu token hết hạn
    } catch (e) {
        return true; // token không hợp lệ
    }
}

function handleLogout() {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

// Lấy token từ localStorage
const token = localStorage.getItem('jwtToken');
const API_BASE = "http://localhost:8080";
if (!token || isTokenExpired(token)) {
    handleLogout(); // token hết hạn → logout
} else {
    fetch('http://localhost:8080/profile', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        mode: 'cors'
    })
    .then(res => {
        if (!res.ok) throw new Error('Không thể lấy thông tin user');
        return res.json();
    })
    .then(user => {
        const fullName = user.fullname || 'User';
        const role = user.role;
        const userId = user.id;

        // Lưu thông tin user để dùng ở các phần khác
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', userId);
        

        // Hiển thị dropdown user
        const loginHeaderBtn = document.getElementById('loginBtn');
        if (loginHeaderBtn && typeof showUserDropdown === 'function') {
            showUserDropdown(loginHeaderBtn, fullName, role);
        }
    })
    .catch(err => {
        console.error('Error fetching profile:', err);
        handleLogout();
    });
}

// ===================== MỞ KẾT NỐI WEBSOCKET ==================================
        const socket = new SockJS('http://localhost:8080/ws'); 
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;


document.addEventListener('DOMContentLoaded', () => {
    const loginHeaderBtn = document.getElementById('loginBtn');
    const fullName = localStorage.getItem('userFullName') || 'User';
    const role = parseInt(localStorage.getItem('userRole')) || 0;

    if (loginHeaderBtn && typeof showUserDropdown === 'function') {
        showUserDropdown(loginHeaderBtn, fullName, role);
    }
});

function showUserDropdown(loginHeaderBtn, fullname, role) {
    if (!loginHeaderBtn) return;

    // Xóa event listener cũ
    const newLoginHeaderBtn = loginHeaderBtn.cloneNode(true);
    loginHeaderBtn.parentNode.replaceChild(newLoginHeaderBtn, loginHeaderBtn);
    loginHeaderBtn = newLoginHeaderBtn;

    // Thay nội dung nút
    loginHeaderBtn.innerHTML = `
        <span class="span">${fullname}</span>
        <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
    `;

    // Tạo dropdown
    const dropdown = document.createElement('ul');
    dropdown.classList.add('user-dropdown');

    let options = [];
    if (role === 0) options = ['User'];
    else if (role === 1) options = ['Admin', 'User'];
    else if (role === 2) options = ['Manager', 'User'];

    options.forEach(option => {
        const li = document.createElement('li');
        li.textContent = option;
        li.classList.add('dropdown-item');
        li.addEventListener('click', () => {
            if(option === 'User') window.location.href = 'user.html';
            else if(option === 'Admin') window.location.href = 'admin.html';
            else if(option === 'Manager') window.location.href = 'manager.html';
        });
        dropdown.appendChild(li);
    });

    // Thêm Logout
    const logoutLi = document.createElement('li');
    logoutLi.textContent = 'Logout';
    logoutLi.classList.add('dropdown-item');
    logoutLi.addEventListener('click', () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    });
    dropdown.appendChild(logoutLi);

    loginHeaderBtn.appendChild(dropdown);

    // Click để mở dropdown
    loginHeaderBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Click ra ngoài đóng dropdown
    document.addEventListener('click', () => dropdown.classList.remove('active'));
}


/* ===================== SIDEBAR NAVIGATION ===================== */
const menuItems = document.querySelectorAll(".sidebar-left nav li");
const chargingBtn = document.querySelector(".sidebar-left nav li:nth-child(1)");
const profileBtn = document.querySelector(".sidebar-left nav li:nth-child(2)");
const walletBtn = document.querySelector(".sidebar-left nav li:nth-child(3)");
const registrationBtn = document.querySelector(".sidebar-left nav li:nth-child(4)");
const authenBtn = document.querySelector(".sidebar-left nav li:nth-child(5)");

const mainContent = document.querySelector(".main-content");
const sidebarRight = document.querySelector(".sidebar-right");
const profilePage = document.querySelector(".profile-page");
const registrationPage = document.querySelector(".registration-page");
const authenPage = document.querySelector(".authentication-page");
const walletPage = document.querySelector(".wallet-page");

// Reset active menu
function clearActive() {
  menuItems.forEach(item => item.classList.remove("active"));
}

// Ẩn tất cả trang
function hideAllPages() {
  mainContent.style.display = "none";
  sidebarRight.style.display = "none";
  profilePage.style.display = "none";
  registrationPage.style.display = "none";
  authenPage.style.display = "none";
  walletPage.style.display = "none";
}

/* ========== CHARGING PAGE ========== */
chargingBtn.addEventListener("click", () => {
  hideAllPages();
  mainContent.style.display = "block";
  sidebarRight.style.display = "block";

  clearActive();
  chargingBtn.classList.add("active");
});

/* ========== PROFILE ========== */
profileBtn.addEventListener("click", () => {
  hideAllPages();
  profilePage.style.display = "block";
  clearActive();
  profileBtn.classList.add("active");
});

/* ========== REGISTRATION ========== */
registrationBtn.addEventListener("click", () => {
  hideAllPages();
  registrationPage.style.display = "block";
  clearActive();
  registrationBtn.classList.add("active");
});

/* ========== AUTHENTICATION ========== */
authenBtn.addEventListener("click", () => {
  hideAllPages();
  authenPage.style.display = "block";
  clearActive();
  authenBtn.classList.add("active");
});

/* ========== WALLET ========== */
walletBtn.addEventListener("click", () => {
  hideAllPages();
  walletPage.style.display = "block";
  clearActive();
  walletBtn.classList.add("active");
});

/* ============================================================
   Cập nhật thông tin người dùng
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    const personalForm = document.getElementById('personalForm');
    if (!token || isTokenExpired(token)) {
        alert("Bạn chưa đăng nhập!");
        handleLogout();
        window.location.href = "index.html";
        return;
    }

    // ===== Load profile data từ server =====
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Không lấy được thông tin người dùng');

        const user = await res.json();

        // Điền thông tin vào form
        personalForm.fullName.value = user.fullname || '';
        personalForm.email.value = user.email || '';
        personalForm.password.value = '';
        personalForm.password.placeholder = '••••••••••';
        personalForm.phone.value = user.phone || '';
        personalForm.birthday.value = user.birthday || '';

    } catch (err) {
        console.error(err);
        alert('Lỗi khi tải thông tin người dùng.');
    }

    // ===== Handle Save Changes =====
    personalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedData = {
            fullname: personalForm.fullName.value.trim(),
            email: personalForm.email.value.trim(),
            password: personalForm.password.value, // nếu muốn thay đổi password
            phone: personalForm.phone.value.trim(),
            birthday: personalForm.birthday.value
        };

        try {
            const res = await fetch(`${API_BASE}/update`, {
                method: 'PUT', // hoặc POST tùy API
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(updatedData)
            });

            const result = await res.json();
            if (res.ok) {
                alert('Cập nhật thông tin thành công!');
            } else {
                alert('Cập nhật thất bại: ' + (result.message || 'Lỗi server'));
            }
        } catch (err) {
            console.error(err);
            alert('Không thể kết nối tới server.');
        }
    });
});

/* ============================================================
   VEHICLE MODAL
   ============================================================ */
// LẤY DANH SÁCH XE TỪ API /profile
async function loadVehicles() {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error("Lỗi lấy thông tin người dùng");

        const userData = await res.json();
        const vehicles = userData.vehicles || []; // giả sử backend trả về mảng vehicles

        const tbody = document.getElementById("vehicleTableBody");
        tbody.innerHTML = ""; // xóa dữ liệu cũ

        vehicles.forEach(vehicle => {
            const tr = document.createElement("tr");
            tr.dataset.vehicleId = vehicle.id; // lưu ID để edit/delete
            tr.innerHTML = `
                <td>${vehicle.type}</td>
                <td>${vehicle.identifier}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        alert("Không tải được danh sách xe!");
    }
}

// THÊM XE MỚI
async function addVehicle(type, identifier) {
    try {
        const res = await fetch(`${API_BASE}/add/vehicles`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, identifier })
        });
        if (res.ok) {
            alert("Thêm xe thành công!");
            loadVehicles(); // reload danh sách
        } else {
            alert("Thêm xe thất bại!");
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
}

// SỬA XE
async function updateVehicle(vehicleId, type, identifier) {
    try {
        const res = await fetch(`${API_BASE}/update/vehicles/${vehicleId}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, identifier })
        });
        if (res.ok) {
            alert("Cập nhật thành công!");
            loadVehicles();
        } else {
            alert("Cập nhật thất bại!");
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
}

// XÓA XE
async function deleteVehicle(vehicleId) {
    if (!confirm("Xóa xe này?")) return;
    try {
        const res = await fetch(`${API_BASE}/delete/vehicles/${vehicleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            alert("Xóa thành công!");
            loadVehicles();
        } else {
            alert("Xóa thất bại!");
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
}

const vehicleModal = document.getElementById("vehicleModal");
const addVehicleBtn = document.getElementById("addVehicleBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const saveVehicleBtn = document.getElementById("saveVehicleBtn");
const vehicleType = document.getElementById("vehicleType");
const licensePlateInput = document.getElementById("licensePlate");
const modalTitle = document.getElementById("modalTitle");

let editingVehicleId = null; // lưu ID xe đang sửa

// MỞ MODAL THÊM MỚI
addVehicleBtn.addEventListener("click", () => {
    editingVehicleId = null;
    modalTitle.textContent = "Add Vehicle";
    vehicleType.value = "EV Car";
    licensePlateInput.value = "";
    vehicleModal.style.display = "flex";
});

// ĐÓNG MODAL
cancelModalBtn.addEventListener("click", () => {
    vehicleModal.style.display = "none";
});

// LƯU (THÊM HOẶC SỬA)
saveVehicleBtn.addEventListener("click", () => {
    const type = vehicleType.value;
    const identifier = licensePlateInput.value.trim();

    if (!identifier) {
        alert("Vui lòng nhập biển số xe!");
        return;
    }

    if (editingVehicleId) {
        updateVehicle(editingVehicleId, type, identifier);
    } else {
        addVehicle(type, identifier);
    }
    vehicleModal.style.display = "none";
});

// XỬ LÝ NÚT EDIT VÀ DELETE TRONG BẢNG
document.getElementById("vehicleTableBody").addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row || !row.dataset.vehicleId) return;

    const vehicleId = row.dataset.vehicleId;

    if (e.target.classList.contains("edit-btn")) {
        editingVehicleId = vehicleId;
        modalTitle.textContent = "Edit Vehicle";
        vehicleType.value = row.children[0].textContent;
        licensePlateInput.value = row.children[1].textContent;
        vehicleModal.style.display = "flex";
    }

    if (e.target.classList.contains("delete-btn")) {
        deleteVehicle(vehicleId);
    }
});

// TẢI DANH SÁCH XE KHI VÀO TRANG PROFILE (HOẶC CHARGING)
document.addEventListener("DOMContentLoaded", () => {
    // Nếu bạn vào tab Profile hoặc Charging thì load xe
    if (window.location.hash.includes("profile") || document.querySelector(".profile-page")?.style.display === "block") {
        loadVehicles();
    }
});

// GỌI LẠI KHI CHUYỂN SANG TAB PROFILE (nếu bạn dùng sidebar như trước)
profileBtn?.addEventListener("click", loadVehicles);


/* ========== REGISTRATION LOGIC ========== */
/* ===================== REGISTRATION PAGE – FULL API REAL ===================== */
const registrationForm = document.querySelector('.registration-form');
const registerBtn = document.getElementById("registration-form");
const statusEl = document.getElementById("registrationStatus");

// Các input để dễ lấy giá trị
const inputs = {
    fullName: registrationForm.querySelector('input[placeholder="Enter full name"]'),
    email: registrationForm.querySelector('input[type="email"]'),
    idNumber: registrationForm.querySelector('input[placeholder="Enter ID number"]'),
    phone: registrationForm.querySelector('input[placeholder="Enter phone number"]'),
    birthday: registrationForm.querySelector('input[type="date"]'),
    address: registrationForm.querySelector('input[placeholder="Enter address"]')
};

let currentPromoteId = null; // Lưu ID yêu cầu đăng ký (nếu có)

/* ===== 1. TẢI THÔNG TIN NGƯỜI DÙNG + TRẠNG THÁI ĐĂNG KÝ ===== */
async function loadRegistrationData() {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error();
        const user = await res.json();
        console.log(user);

        // Điền thông tin vào form (chỉ điền nếu có dữ liệu)
        inputs.fullName.value = user.fullname || '';
        inputs.email.value = user.email || '';
        inputs.idNumber.value = user.identification || '';
        inputs.phone.value = user.phone || '';
        inputs.birthday.value = user.birthday || '';
        inputs.address.value = user.address || '';

        // Kiểm tra xem user đã từng gửi yêu cầu đăng ký chưa
        if (user.identification && user.address) {
            checkPromoteStatus();
        } else {
            // Chưa gửi → hiện nút Register bình thường
            showRegisterButton();
        }

    } catch (err) {
        console.error("Lỗi tải thông tin:", err);
        alert("Không tải được thông tin cá nhân!");
    }
}

/* ===== 2. KIỂM TRA TRẠNG THÁI YÊU CẦU ĐĂNG KÝ ===== */
async function checkPromoteStatus() {
    try {
        const res = await fetch(`${API_BASE}/promote/user`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error();

        const promote = await res.json();
        const status = promote.status?.toLowerCase(); // "pending", "approved", "rejected"

        if (status === "approved") {
            setRegistrationStatus("approved");
            registerBtn.style.display = "none";
        } else if (status === "pending") {
            setRegistrationStatus("pending");
            registerBtn.style.display = "none";
        } else {
            showRegisterButton(); // rejected hoặc lỗi → cho gửi lại
        }

    } catch (err) {
        console.error("Lỗi kiểm tra trạng thái:", err);
        showRegisterButton(); // nếu lỗi → cho gửi lại
    }
}

/* ===== 3. HIỆN NÚT REGISTER ===== */
function showRegisterButton() {
    registerBtn.style.display = "block";
    registerBtn.textContent = "Register";
    statusEl.style.display = "none";
}

/* ===== 4. HIỂN THỊ TRẠNG THÁI ===== */
function setRegistrationStatus(status) {
    statusEl.style.display = "inline-block";
    statusEl.className = "registration-status " + status;
    statusEl.textContent = status === "approved" ? "Approved" : "Pending";
    registerBtn.style.display = "none";
}

/* ===== 5. XỬ LÝ KHI NHẤN REGISTER ===== */
registerBtn.addEventListener("click", async function(e) {
    e.preventDefault();

    // Kiểm tra các trường bắt buộc
    if (!inputs.fullName.value || !inputs.email.value || !inputs.idNumber.value || !inputs.phone.value || !inputs.address.value) {
        alert("Vui lòng điền đầy đủ Họ tên, Email, CCCD, địa chỉ và Số điện thoại!");
        return;
    }

    const promoteData = {
        fullName: inputs.fullName.value.trim(),
        email: inputs.email.value.trim(),
        identification: inputs.idNumber.value.trim(),
        phone: inputs.phone.value.trim(),
        birthday: inputs.birthday.value || null,
        address: inputs.address.value.trim() || null
    };

    try {
        registerBtn.textContent = "Đang gửi...";
        registerBtn.disabled = true;

        const res = await fetch(`${API_BASE}/promote/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(promoteData)
        });

        if (res.ok) {
            const result = await res.json();
            currentPromoteId = result.promoteId || result.id;

            setRegistrationStatus("pending");
            alert("Gửi yêu cầu đăng ký thành công! Vui lòng chờ quản trị viên duyệt.");
        } else {
            const msg = await res.text();
            alert("Gửi yêu cầu thất bại: " + msg);
            registerBtn.textContent = "Register";
            registerBtn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối server!");
        registerBtn.textContent = "Register";
        registerBtn.disabled = false;
    }
});

/* ===== TỰ ĐỘNG TẢI KHI VÀO TRANG REGISTRATION ===== */
document.addEventListener("DOMContentLoaded", () => {
    const isRegistrationPage = document.querySelector('.registration-page')?.style.display !== "none";
    if (isRegistrationPage || window.location.hash.includes("registration")) {
        loadRegistrationData();
    }
});

// Khi chuyển sang tab Registration từ sidebar
registrationBtn?.addEventListener("click", () => {
    setTimeout(loadRegistrationData, 100);
});


/* ========== AUTHENTICATION LOGIC ========== */
const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const verifyBtn = document.querySelector(".verify-btn");

authForm.addEventListener("submit", function(e) {
  e.preventDefault();

  if (!document.getElementById("frontImage").files.length ||
      !document.getElementById("backImage").files.length) {
    alert("Vui lòng chọn đủ ảnh mặt trước và mặt sau.");
    return;
  }

  verifyBtn.style.display = "none";
  authStatus.style.display = "inline-block";
  authStatus.textContent = "Authenticated";
});

function previewImage(input, previewId) {
    const file = input.files[0];
    const preview = document.getElementById(previewId);
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      }
      reader.readAsDataURL(file);
    } else {
      preview.src = "";
      preview.style.display = "none";
    }
  }

  document.getElementById("frontImage").addEventListener("change", function() {
    previewImage(this, "frontPreview");
  });

  document.getElementById("backImage").addEventListener("change", function() {
    previewImage(this, "backPreview");
  });

// ĐỊNH DẠNG TIỀN VIỆT NAM
function formatVND(amount) {
    if (amount === undefined || amount === null) return "0";
    return Number(amount).toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/* ========== CHARGING STATE LOGIC (Start → Stop → Continue → Payment) ========== */
let chargingState = "start";  // start → stop → continue
let chargerId = null;
let identifier = null;
let billId = null;

const chargingStateBtn = document.getElementById("chargingActionBtn");
const paymentBtn = document.getElementById("paymentBtn");

// Kết nối STOMP
stompClient.connect({}, function(frame) {
    const userId = localStorage.getItem('userId');

    // Nhận thông tin charger + biển số từ server
    stompClient.subscribe('/topic/charger/' + userId, function(message) {
        const data = JSON.parse(message.body);

        if (data.chargerId && data.identifier) {
            chargerId = data.chargerId;
            identifier = data.identifier;
            console.log('Charger info:', chargerId, identifier);
        }
    });
});

// Cập nhật giao diện nút
function updateChargingUI() {
    if (chargingState === "start") {
        chargingStateBtn.textContent = "Start Charging";
        paymentBtn.style.display = "none";
        paymentBtn.disabled = true;
    } else if (chargingState === "stop") {
        chargingStateBtn.textContent = "Stop Charging";
        paymentBtn.style.display = "none";
        paymentBtn.disabled = true;
    } else if (chargingState === "continue") {
        chargingStateBtn.textContent = "Continue";
        paymentBtn.style.display = "inline-block";
        paymentBtn.disabled = false;
    }
}

// XỬ LÝ NHẤN NÚT CHÍNH
chargingStateBtn.addEventListener("click", async () => {
    if (!chargerId || !identifier) {
        alert("Chưa nhận thông tin trạm sạc. Vui lòng chờ...");
        return;
    }
    const token = localStorage.getItem('jwtToken');
    // 1. START CHARGING
    if (chargingState === "start") {
        try {
            const response = await fetch(`http://localhost:8080/bills/make/${chargerId}/${identifier}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                mode: 'cors'
            });
            if (!response.ok) {
                const text = await response.text();
                alert('Tạo bill thất bại: ' + response.status);
                return;
            }
            const result = await response.json();
            billId = result.id;
            localStorage.setItem('billId', billId);
            chargingState = "stop";
            updateChargingUI();
            // Subscribe realtime log
            stompClient.subscribe('/topic/log/' + billId, function(message) {
                const logData = JSON.parse(message.body);
                console.log('Realtime log:', logData); 

                const batteryEl = document.getElementById('batteryPercentage');
                if (batteryEl) {
                    const percent = logData.percenatge !== undefined ? logData.percenatge : (logData.percentage || 0);
                    batteryEl.textContent = percent + ' %';
                }

                const timeEl = document.getElementById('time');
                if (timeEl && logData.time !== undefined) {
                    const totalMinutes = logData.time * 60;
                    const h = Math.floor(totalMinutes / 60);
                    const m = Math.floor(totalMinutes % 60);
                    const s = Math.floor((totalMinutes % 1) * 60);
                    timeEl.textContent = `${h}h ${m}m ${s}s`;
                }

                const voltageEl = document.getElementById('voltageValue');
                if (voltageEl) voltageEl.textContent = (logData.voltage || 0) + ' V';

                const currentEl = document.getElementById('currentValue');
                if (currentEl) currentEl.textContent = (logData.current || 0) + ' A';

                const totalEl = document.getElementById('totalCharger');
                if (totalEl) totalEl.textContent = (logData.totalCharger || 0) + ' kWh';

                const totalE2 = document.getElementById('totalCharger1');
                if (totalE2) totalE2.textContent = (logData.totalCharger || 0) + ' kWh';

                const costEl = document.getElementById('totalCost');
                if (costEl) costEl.textContent = formatVND(logData.amount) + ' VND';

                const priceEl = document.getElementById('price');
                if (priceEl) priceEl.textContent = (formatVND(logData.price) || 0.09) + ' VND';

                const batteryLevel = document.querySelector('.battery-level');
                
                if (batteryLevel) {
                  const percent = Math.min(100, Math.max(0, 
                      logData.percenatge !== undefined ? logData.percenatge : (logData.percentage || 0)
                  ));
                  batteryLevel.style.height = percent + '%';
                  // Đổi màu theo mức pin
                  batteryLevel.classList.remove('warning', 'danger');
                  if (percent <= 20) {
                      batteryLevel.classList.add('danger');
                  } else if (percent <= 50) {
                      batteryLevel.classList.add('warning');
                  }
                }
            });
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server");
        }
    }

    // 2. STOP CHARGING → GỌI API PAUSE
    else if (chargingState === "stop") {
        billId = localStorage.getItem('billId');
        if (!billId) {
            alert("Không tìm thấy bill đang sạc!");
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/bills/pause/${billId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (response.ok) {
                const latestBill = await fetchLatestBill(billId);
                if (latestBill) {
                    currentBillData = latestBill;
                    chargingState = "continue";
                    updateChargingUI();
                    showBillModal(latestBill);  // TỰ ĐỘNG HIỆN BILL
                }
            }
        } catch (err) {
            alert("Không thể dừng sạc. Vui lòng thử lại!");
            chargingStateBtn.textContent = "Stop Charging";
            chargingStateBtn.disabled = false;
        }
    }

    // 3. CONTINUE CHARGING → GỌI API RESUME
    else if (chargingState === "continue") {
        try {
            const response = await fetch(`http://localhost:8080/bills/continue/${billId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            if (response.ok) {
                chargingState = "stop";
                updateChargingUI();
            }
        } catch (err) {
            alert("Lỗi khi tiếp tục sạc");
        }
    }
});

// Khởi động UI
updateChargingUI();

let currentBillData = null;

// Hàm định dạng thời gian
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

// LẤY BILL MỚI NHẤT QUA API GET
async function fetchLatestBill(billId) {
    try {
        const response = await fetch(`http://localhost:8080/bills/${billId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken')
            }
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error("Không lấy được bill");
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi khi lấy thông tin hóa đơn");
        return null;
    }
}

// HIỆN BILL MODAL
function showBillModal(bill) {
    if (!bill) return;
    currentBillData = bill;

    document.getElementById('billUserName').textContent = bill.userName || "Khách lẻ";
    document.getElementById('billDescription').textContent = bill.description || "Electricity Bill";
    document.getElementById('billChargerId').textContent = bill.chargerId;
    document.getElementById('billVehicle').textContent = identifier || "Không rõ";

    let totalSeconds = 0;
    const timeList = document.getElementById('billTimeList');
    timeList.innerHTML = '';

    if (bill.timeUse && Array.isArray(bill.timeUse) && bill.timeUse.length > 0) {
        bill.timeUse.forEach((session, index) => {
            const start = new Date(session.startedAt);
            const end = new Date(session.endedAt || new Date());
            const seconds = Math.round((end - start) / 1000);
            totalSeconds += seconds;

            const li = document.createElement('li');
            li.innerHTML = `
                <strong>Lần ${index + 1}:</strong> 
                ${start.toLocaleString('vi-VN')} → ${end.toLocaleString('vi-VN')} 
                <span style="color:#4CAF50; font-weight:bold;">(${formatTime(seconds)})</span>
            `;
            timeList.appendChild(li);
        });
    } else {
        timeList.innerHTML = '<li>Chưa có chi tiết thời gian</li>';
    }

    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    document.getElementById('billTotalTime').textContent = 
        totalMinutes > 0 ? `${totalMinutes} phút ${remainingSeconds} giây` : `${totalSeconds} giây`;

    document.getElementById('billAmount').textContent = formatVND(bill.amount) + ' VND';

    document.getElementById('billModal').style.display = 'flex';
}

// ĐÓNG MODAL
document.getElementById('cancelBillBtn').onclick = () => {
    document.getElementById('billModal').style.display = 'none';
};

// THANH TOÁN QUA PUT /bills/paid/{billId}
document.getElementById('submitPaymentBtn').onclick = async () => {
    try {
        const res = await fetch(`http://localhost:8080/bills/paid/${billId}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('jwtToken'),
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            document.getElementById('billModal').style.display = 'none';
            chargingState = "start";
            billId = null;
            localStorage.removeItem('billId');
            currentBillData = null;
            updateChargingUI();
            alert('Thanh toán thành công!');
        } else {
            alert("Thanh toán thất bại. Vui lòng thử lại!");
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
};

// NHẤN NÚT PAYMENT → LẠI GỌI GET BILL VÀ HIỆN LẠI
paymentBtn.onclick = async () => {
    if (!billId) {
        alert("Không có hóa đơn nào để xem!");
        return;
    }
    const latestBill = await fetchLatestBill(billId);
    if (latestBill) showBillModal(latestBill);
};

/* ===================== WALLET & HISTORY – FULL API REAL ===================== */

const walletTab = document.getElementById('walletTab');
const historyTab = document.getElementById('historyTab');
const walletSection = document.querySelector('.wallet-section');
const historySection = document.querySelector('.history-section');

const bankSelect = document.getElementById('bankSelect');
const bankForm = document.getElementById('bankForm');
const accountNumber = document.getElementById('accountNumber');
const accountName = document.getElementById('accountName');
const connectBank = document.getElementById('connectBank');

const selectedAccount = document.querySelector('.account-dropdown .selected');
const optionsContainer = document.querySelector('.account-dropdown .options');

const depositBtn = document.getElementById('deposit');
const withdrawBtn = document.getElementById('withdraw');
const amountForm = document.getElementById('amountForm');
const amountInput = document.getElementById('amountInput');
const finishBtn = document.getElementById('finishBtn');

let currentUserBankAccounts = []; // lưu danh sách tài khoản đã liên kết

// TẢI THÔNG TIN NGƯỜI DÙNG + BALANCE + FULLNAME
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_BASE}/profile`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.querySelector('.wallet-card h2').textContent = data.fullname || "User";
        document.querySelector('.wallet-card p').textContent = `Balance: ${formatVND(data.balance || 0)}`;
    } catch (err) {
        console.error("Lỗi load profile");
    }
}

// TẢI DANH SÁCH NGÂN HÀNG VÀO SELECT
async function loadBanks() {
    try {
        const res = await fetch(`${API_BASE}/bank/all`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error();
        const banks = await res.json();

        bankSelect.innerHTML = '<option value="">Select Bank</option>';
        banks.forEach(bank => {
            const opt = document.createElement('option');
            opt.value = bank.id;
            opt.textContent = bank.bankName;
            bankSelect.appendChild(opt);
        });
    } catch (err) {
        alert("Không tải được danh sách ngân hàng!");
    }
}

// TẢI DANH SÁCH TÀI KHOẢN ĐÃ LIÊN KẾT
async function loadLinkedAccounts() {
    try {
        const res = await fetch(`${API_BASE}/bankAccount/all`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error();
        currentUserBankAccounts = await res.json();

        optionsContainer.innerHTML = "";
        if (currentUserBankAccounts.length === 0) {
            selectedAccount.textContent = "-- No Account Linked --";
            return;
        }

        currentUserBankAccounts.forEach(acc => {
            const div = document.createElement('div');
            div.className = 'option';
            div.innerHTML = `
                <span>${acc.bankName} - ${acc.accountNumber}</span>
                <button class="accountdelete">Delete</button>
            `;
            div.dataset.accountId = acc.id;
            optionsContainer.appendChild(div);
        });
        selectedAccount.textContent = "-- Choose Account --";
    } catch (err) {
        console.error("Lỗi load tài khoản liên kết");
    }
}

// LIÊN KẾT TÀI KHOẢN NGÂN HÀNG
connectBank.addEventListener('click', async () => {
    const bankId = bankSelect.value;
    const accNum = accountNumber.value.trim();
    const accName = accountName.value.trim();

    if (!bankId || !accNum || !accName) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/bankAccount/create/${bankId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                accountNumber: accNum, 
                accountHolderName: accName 
            })
        });

        // ĐỌC BODY TRƯỚC KHI DÙNG res.json() HOẶC res.text()
        const contentType = res.headers.get("content-type");
        let responseData = null;
        if (contentType && contentType.includes("application/json")) {
            responseData = await res.json();
        } else {
            responseData = await res.text();
        }

        if (res.ok) {
            // THÀNH CÔNG THẬT SỰ
            alert("Liên kết tài khoản thành công!");
            accountNumber.value = "";
            accountName.value = "";
            bankSelect.value = "";
            bankForm.style.display = "none";

            // BẮT BUỘC LOAD LẠI DANH SÁCH – ĐẢM BẢO HIỆN THỊ NGAY
            await loadLinkedAccounts();
        } else {
            // LỖI TỪ SERVER (400, 409, 500...)
            alert("Liên kết thất bại: " + (responseData.message || responseData || "Lỗi không xác định"));
        }
    } catch (err) {
        console.error("Lỗi kết nối:", err);
        alert("Lỗi kết nối server. Vui lòng kiểm tra mạng hoặc thử lại!");
    }
});

// XÓA TÀI KHOẢN ĐÃ LIÊN KẾT
optionsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('accountdelete')) {
        e.stopPropagation();
        const option = e.target.closest('.option');
        const accountId = option.dataset.accountId;
        const accText = option.querySelector('span').textContent;

        if (!confirm(`Xóa tài khoản "${accText}"?`)) return;

        try {
            const res = await fetch(`${API_BASE}/bankAccount/delete/${accountId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                option.remove();
                if (optionsContainer.children.length === 0) {
                    selectedAccount.textContent = "-- No Account Linked --";
                }
                alert("Xóa thành công!");
            }
        } catch (err) {
            alert("Xóa thất bại!");
        }
    }

    // Chọn tài khoản
    if (e.target.closest('.option') && !e.target.classList.contains('accountdelete')) {
        const option = e.target.closest('.option');
        selectedAccount.textContent = option.querySelector('span').textContent;
        selectedAccount.dataset.accountId = option.dataset.accountId;
        optionsContainer.style.display = 'none';
    }
});

// GỌI DEPOSIT HOẶC WITHDRAW
finishBtn.addEventListener('click', async () => {
    const amount = parseInt(amountInput.value);
    const accountId = selectedAccount.dataset.accountId;

    if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền hợp lệ!");
    if (!accountId) return alert("Vui lòng chọn tài khoản!");

    const isDeposit = depositBtn.classList.contains('active');
    const endpoint = isDeposit ? 'deposit' : 'withdraw';

    try {
        const res = await fetch(`${API_BASE}/bills/${accountId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount })
        });

        if (res.ok) {
            alert(`${isDeposit ? "Nạp" : "Rút"} tiền thành công ${formatVND(amount)}!`);
            amountInput.value = "";
            amountForm.style.display = "none";
            loadUserProfile(); // cập nhật balance
            if (historyTab.classList.contains('active')) {
                loadHistoryBills(); // nếu đang ở tab History thì reload
            }
        } else {
            alert(`${isDeposit ? "Nạp" : "Rút"} tiền thất bại!`);
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
});
console.log(token);
// TẢI LỊCH SỬ GIAO DỊCH
async function loadHistoryBills() {
    try {
        const res = await fetch(`${API_BASE}/bills/all/user`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        if (!res.ok) throw new Error();
        const bills = await res.json();

        const container = document.querySelector('.history-list');
        container.innerHTML = "";

        if (bills.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#999;'>Chưa có giao dịch nào</p>";
            return;
        }

        bills.forEach(bill => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.dataset.billId = bill.id; // lưu ID để click xem chi tiết
            div.dataset.billType = bill.billType; // lưu loại bill
            const typeText = bill.billType === 'ELECTRIC' ? 'Sạc điện' : 'Ngân hàng';
            const color = bill.billType === 'ELECTRIC' ? '#2e7d32' : '#d32f2f';

            div.innerHTML = `
                <span>${bill.userName || bill.cardHolderName || "Bạn"}</span>
                <span>${bill.id}</span>
                <span>${bill.description}</span>
                <span>${formatVND(bill.amount)}</span>
                <span>${new Date(bill.paidAt).toLocaleDateString('vi-VN')}</span>
                <span id="billdetail"><i class="fa-solid fa-eye"></i></span>
            `;
            container.appendChild(div);
        });

        // LẮNG NGHE CLICK VÀO MẮT XEM CHI TIẾT
        container.addEventListener('click', async (e) => {
            const eye = e.target.closest('#billdetail');
            if (!eye) return;

            const billItem = eye.closest('.history-item');
            const billId = billItem.dataset.billId;
            const billType = billItem.dataset.billType;
            console.log(billId);
            console.log(billType);
            await showBillDetail(billId, billType);
        });

    } catch (err) {
        console.error(err);
        document.querySelector('.history-list').innerHTML = "<p style='color:red;'>Lỗi tải lịch sử giao dịch</p>";
    }
}

// ĐỊNH DẠNG THỜI GIAN SẠC: 
function formatChargingTime(hours) {
    if (!hours || hours <= 0) return "0 giây";

    // Chuyển giờ thập phân → giây
    const totalSeconds = Math.round(hours * 3600);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}<small>h</small>`);
    if (m > 0 || h > 0) parts.push(`${m}<small>m</small>`); // luôn hiện phút nếu có giờ
    parts.push(`${s}<small>s</small>`);

    return parts.join(' ');
}

// HÀM HIỆN CHI TIẾT BILL
async function showBillDetail(billId, billType) {
    try {
        const res = await fetch(`${API_BASE}/bills/${billId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error();
        const bill = await res.json();

        let html = '';

        if (billType === 'ElECTRIC') {
            html = `
                <div class="bill-detail-item"><strong>Description:</strong> <span>${bill.description || "Hóa đơn sạc"}</span></div>    
                <div class="bill-detail-item"><strong>User:</strong> <span>${bill.userName || "Không rõ"}</span></div>
                <div class="bill-detail-item"><strong>Chargers:</strong> <span>${bill.chargerId || "-"}</span></div>
                <div class="bill-detail-item"><strong>Thời gian sạc:</strong> <span>${formatChargingTime(bill.totalTime)}</span></div>
                <div class="bill-detail-item"><strong>Paid At:</strong> <span>${new Date(bill.paidAt).toLocaleString('vi-VN')}</span></div>
                <div class="bill-detail-item"><strong style="font-size:1.4em; color:#d32f2f;">Amount:</strong> 
                  <span style="font-size:1.4em; font-weight:bold; color:#d32f2f;">${formatVND(bill.amount)}</span>
                </div>
            `;
        } else if (billType === 'BANK') {
            html = `
                <div class="bill-detail-item"><strong>Description:</strong> <span>${bill.description || "Giao dịch ngân hàng"}</span></div>    
                <div class="bill-detail-item"><strong>Bank:</strong> <span>${bill.bankName || "Không rõ"}</span></div>
                <div class="bill-detail-item"><strong>Card Holder:</strong> <span>${bill.cardHolderName || "Không rõ"}</span></div>
                <div class="bill-detail-item"><strong>Card Number:</strong> <span>${bill.cardNumber||"Không rõ"}</span></div>
                <div class="bill-detail-item"><strong>Paid At:</strong> <span>${new Date(bill.paidAt).toLocaleString('vi-VN')}</span></div>
                <div class="bill-detail-item"><strong style="font-size:1.4em; color:#2e7d32;">Amount:</strong> 
                  <span style="font-size:1.4em; font-weight:bold; color:#2e7d32;">${formatVND(bill.amount)}</span>
                </div>
            `;
        }

        document.getElementById('billDetailContent').innerHTML = html;
        document.getElementById('billDetailOverlay').style.display = 'flex';

    } catch (err) {
        alert("Không thể tải chi tiết giao dịch!");
    }
}

// ĐÓNG POPUP KHI CLICK NGOÀI HOẶC NÚT X
document.getElementById('billDetailOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('billDetailOverlay')) {
        document.getElementById('billDetailOverlay').style.display = 'none';
    }
});

// ĐỊNH DẠNG TIỀN 
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// CHUYỂN TAB
walletTab.addEventListener('click', () => {
    walletTab.classList.add('active');
    historyTab.classList.remove('active');
    walletSection.classList.add('active');
    historySection.classList.remove('active');
    loadUserProfile();
    loadLinkedAccounts();
});

historyTab.addEventListener('click', () => {
    historyTab.classList.add('active');
    walletTab.classList.remove('active');
    historySection.classList.add('active');
    walletSection.classList.remove('active');
    loadHistoryBills();
});

// HIỂN THỊ FORM NGÂN HÀNG KHI CHỌN
bankSelect.addEventListener('change', () => {
    bankForm.style.display = bankSelect.value ? 'block' : 'none';
});

// HIỂN THỊ FORM NHẬP TIỀN KHI CHỌN DEPOSIT/WITHDRAW
[depositBtn, withdrawBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        depositBtn.classList.toggle('active', btn === depositBtn);
        withdrawBtn.classList.toggle('active', btn === withdrawBtn);
        amountForm.style.display = 'block';
    });
});

// ĐÓNG DROPDOWN KHI CLICK NGOÀI
document.addEventListener('click', (e) => {
    if (!document.querySelector('.account-dropdown').contains(e.target)) {
        optionsContainer.style.display = 'none';
    }
});

// MỞ DROPDOWN
selectedAccount.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
});

// TẢI DỮ LIỆU KHI VÀO TAB WALLET LẦN ĐẦU
document.addEventListener("DOMContentLoaded", () => {
    if (walletTab.classList.contains('active')) {
        loadUserProfile();
        loadBanks();
        loadLinkedAccounts();
    }
});

// KHI CHUYỂN SANG TAB WALLET TỪ SIDEBAR
walletBtn?.addEventListener("click", () => {
    setTimeout(() => {
        loadUserProfile();
        loadBanks();
        loadLinkedAccounts();
    }, 100);
});
//localStorage.clear();