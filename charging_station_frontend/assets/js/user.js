'use strict';

/* -------------- TOKEN & USER PROFILE ---------------- */
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); // decode payload
        const now = Date.now() / 1000; 
        return payload.exp < now; // true nếu token hết hạn
    } catch (e) {
        return true; // token không hợp lệ
    }
}

// Lấy token từ localStorage
const token = localStorage.getItem('jwtToken');

// function handleLogout() {
//     localStorage.removeItem('jwtToken');
//     localStorage.removeItem('userFullName');
//     localStorage.removeItem('userRole');
//     localStorage.removeItem('userId');
//     window.location.href = 'index.html';
// }

async function handleLogout() {
  if (!token) return;
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
  } catch (err) {
    console.error('Logout error:', err);
  }
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

//const API_BASE = "http://localhost:8080";
const API_BASE = "http://178.128.209.28:8080";
if (!token || isTokenExpired(token)) {
    handleLogout(); // token không hợp lệ hoặc hết hạn
} else {
    fetch(`${API_BASE}/profile`, {
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

        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', userId);
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
    const newLoginHeaderBtn = loginHeaderBtn.cloneNode(true);
    loginHeaderBtn.parentNode.replaceChild(newLoginHeaderBtn, loginHeaderBtn);
    loginHeaderBtn = newLoginHeaderBtn;

    loginHeaderBtn.innerHTML = `
        <span class="span">${fullname}</span>
        <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
    `;

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

    const logoutLi = document.createElement('li');
    logoutLi.textContent = 'Logout';
    logoutLi.classList.add('dropdown-item');
    logoutLi.addEventListener('click', (e) => {
        e.stopPropagation(); 
        handleLogout();      
    });
    dropdown.appendChild(logoutLi);

    loginHeaderBtn.appendChild(dropdown);

    // mở dropdown
    loginHeaderBtn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // đóng dropdown
    document.addEventListener('click', () => dropdown.classList.remove('active'));
}


/* ------------- SIDEBAR NAVIGATION ----------------- */
const menuItems = document.querySelectorAll(".sidebar-left nav li");
const chargingBtn = document.querySelector(".sidebar-left nav li:nth-child(1)");
const profileBtn = document.querySelector(".sidebar-left nav li:nth-child(2)");
const walletBtn = document.querySelector(".sidebar-left nav li:nth-child(3)");
const registrationBtn = document.querySelector(".sidebar-left nav li:nth-child(4)");

const mainContent = document.querySelector(".main-content");
const sidebarRight = document.querySelector(".sidebar-right");
const profilePage = document.querySelector(".profile-page");
const registrationPage = document.querySelector(".registration-page");
const walletPage = document.querySelector(".wallet-page");


function clearActive() {
  menuItems.forEach(item => item.classList.remove("active"));
}

// Ẩn các trang
function hideAllPages() {
  mainContent.style.display = "none";
  sidebarRight.style.display = "none";
  profilePage.style.display = "none";
  registrationPage.style.display = "none";
  walletPage.style.display = "none";
}

/* ----------- CHARGING TAB ------------- */
chargingBtn.addEventListener("click", () => {
  hideAllPages();
  mainContent.style.display = "block";
  sidebarRight.style.display = "block";

  clearActive();
  chargingBtn.classList.add("active");
});

/* ------------ PROFILE TAB ------------- */
profileBtn.addEventListener("click", () => {
  hideAllPages();
  profilePage.style.display = "block";
  clearActive();
  profileBtn.classList.add("active");
});

/* ----------- REGISTRATION TAB ------------ */
registrationBtn.addEventListener("click", () => {
  hideAllPages();
  registrationPage.style.display = "block";
  clearActive();
  registrationBtn.classList.add("active");
});

/* ----------- WALLET TAB -------------- */
walletBtn.addEventListener("click", () => {
  hideAllPages();
  walletPage.style.display = "block";
  clearActive();
  walletBtn.classList.add("active");
});

/* Cập nhật thông tin  */
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    const personalForm = document.getElementById('personalForm');
    if (!token || isTokenExpired(token)) {
        alert("Bạn chưa đăng nhập!");
        handleLogout();
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Không lấy được thông tin người dùng');

        const user = await res.json();

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

    personalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedData = {
            fullname: personalForm.fullName.value.trim(),
            email: personalForm.email.value.trim(),
            password: personalForm.password.value, 
            phone: personalForm.phone.value.trim(),
            birthday: personalForm.birthday.value
        };

        try {
            const res = await fetch(`${API_BASE}/update`, {
                method: 'PUT', 
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

/* ------------VEHICLE MODAL--------------------*/
async function loadVehicles() {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error("Lỗi lấy thông tin người dùng");

        const userData = await res.json();
        const vehicles = userData.vehicles || []; 

        const tbody = document.getElementById("vehicleTableBody");
        tbody.innerHTML = ""; 

        vehicles.forEach(vehicle => {
            const tr = document.createElement("tr");
            tr.dataset.vehicleId = vehicle.id; 
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

// THÊM XE
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

let editingVehicleId = null; 

// MODAL THÊM MỚI
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

// THÊM HOẶC SỬA
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

// EDIT VÀ DELETE 
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

// TẢI DANH SÁCH XE
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.hash.includes("profile") || document.querySelector(".profile-page")?.style.display === "block") {
        loadVehicles();
    }
});
profileBtn?.addEventListener("click", loadVehicles);


/* ------------------ REGISTRATION -------------------- */
const registrationForm = document.querySelector('.registration-form');
const registerBtn = document.getElementById("registration-form");
const statusEl = document.getElementById("registrationStatus");

const inputs = {
    fullName: registrationForm.querySelector('input[placeholder="Enter full name"]'),
    email: registrationForm.querySelector('input[type="email"]'),
    idNumber: registrationForm.querySelector('input[placeholder="Enter ID number"]'),
    phone: registrationForm.querySelector('input[placeholder="Enter phone number"]'),
    birthday: registrationForm.querySelector('input[type="date"]'),
    address: registrationForm.querySelector('input[placeholder="Enter address"]')
};

let currentPromoteId = null; 

/* Lấy thông tin người dùng */
async function loadRegistrationData() {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error();
        const user = await res.json();
        
        inputs.fullName.value = user.fullname || '';
        inputs.email.value = user.email || '';
        inputs.idNumber.value = user.identification || '';
        inputs.phone.value = user.phone || '';
        inputs.birthday.value = user.birthday || '';
        inputs.address.value = user.address || '';

        // Kiểm tra user đã từng đăng ký chưa
        if (user.identification || user.address) {
            checkPromoteStatus();
        } else {
            showRegisterButton();
        }

    } catch (err) {
        console.error("Lỗi tải thông tin:", err);
        alert("Không tải được thông tin cá nhân!");
    }
}

/* -------------- KIỂM TRA YÊU CẦU ĐĂNG KÝ ---------------- */
async function checkPromoteStatus() {
    try {
        const res = await fetch(`${API_BASE}/promote/user`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error();

        const promote = await res.json();
        const status = promote.status; 

        if (status === "Approved") {
            setRegistrationStatus("approved");
            registerBtn.style.display = "none";
        } else if (status === "Pending") {
            setRegistrationStatus("pending");
            registerBtn.style.display = "none";
        } else {
            showRegisterButton(); 
        }

    } catch (err) {
        console.error("Lỗi kiểm tra trạng thái:", err);
        showRegisterButton(); 
    }
}

/* ----------- NÚT ĐĂNG KÝ ---------------*/
function showRegisterButton() {
    registerBtn.style.display = "block";
    registerBtn.textContent = "Register";
    statusEl.style.display = "none";
}

/* ------- TRẠNG THÁI ĐĂNG KÝ ------- */
function setRegistrationStatus(status) {
    statusEl.style.display = "inline-block";
    statusEl.className = "registration-status " + status;
    statusEl.textContent = status;
    registerBtn.style.display = "none";
}

/* -------- NHẤN NÚT ĐĂNG KÝ -------- */
registerBtn.addEventListener("click", async function(e) {
    e.preventDefault();

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

/*-------------- Tải đơn đăng ký -------------- */
document.addEventListener("DOMContentLoaded", () => {
    const isRegistrationPage = document.querySelector('.registration-page')?.style.display !== "none";
    if (isRegistrationPage || window.location.hash.includes("registration")) {
        loadRegistrationData();
    }
});

registrationBtn?.addEventListener("click", () => {
    setTimeout(loadRegistrationData, 100);
});

// ĐỊNH DẠNG TIỀN 
function formatVND(amount) {
    if (amount === undefined || amount === null) return "0";
    return Number(amount).toLocaleString('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/* ----------- CHARGING LOGIC -------------*/
let chargingState = "start"; 
let chargerId = null;
let identifier = null;
let billId = null;

const chargingStateBtn = document.getElementById("chargingActionBtn");
const paymentBtn = document.getElementById("paymentBtn");
chargingStateBtn.classList.add("disabled");
chargingStateBtn.disabled = true;

let stompClient = null;         
let isSocketConnected = false;  

function connectWebSocket() {
    if (isSocketConnected || stompClient) return;

    const socket = new SockJS(`${API_BASE}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, function(frame) {
        isSocketConnected = true;
        const userId = localStorage.getItem('userId');

        stompClient.subscribe('/topic/notifications/' + userId, async function(msg) {
            const data = JSON.parse(msg.body);
            alert(data.type);
            billId = data.billId;
            localStorage.setItem('billId', billId);
            chargingState = "continue";
            updateChargingUI();
            resetRealtimeChart();
            chargingStateBtn.classList.remove("enabled");
            chargingStateBtn.classList.add("disabled");
            chargingStateBtn.disabled = true;
            const latestBill = await fetchLatestBill(billId);
            disconnectWebSocket();
            if (latestBill) {
                currentBillData = latestBill;
                showBillModal(latestBill);
            }
        });

        stompClient.subscribe('/topic/log/' + billId, function(message) {
            const logData = JSON.parse(message.body);

            if (!chart) {
                initRealtimeChart();
            }
            updateRealtimeChart(
                (logData.voltage || 0),  
                logData.current || 0      
            );
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
            if (totalEl) totalEl.textContent = (logData.voltage * logData.current / 1000 || 0) + ' kW';

            const totalE2 = document.getElementById('totalCharger1');
            if (totalE2) {
                let kwhValue = (logData.totalCharger) || 0;
                totalE2.textContent = kwhValue.toFixed(2) + ' kWh';
            }

            const costEl = document.getElementById('totalCost');
            if (costEl) costEl.textContent = formatVND(logData.amount) + ' VND';

            const priceEl = document.getElementById('price');
            if (priceEl) priceEl.textContent = (formatVND(logData.price) || 5000);

            const batteryLevel = document.querySelector('.battery-level');
            
            if (batteryLevel) {
                const percent = Math.min(100, Math.max(0, 
                    logData.percenatge !== undefined ? logData.percenatge : (logData.percentage || 0)
                ));
                batteryLevel.style.height = percent + '%';

                batteryLevel.classList.remove('warning', 'danger');
                if (percent <= 20) {
                    batteryLevel.classList.add('danger');
                } else if (percent <= 50) {
                    batteryLevel.classList.add('warning');
                }
            }
        });
    });
}

function disconnectWebSocket() {
    if (stompClient && isSocketConnected) {
        stompClient.disconnect();
        stompClient = null;
        isSocketConnected = false;
    }
    resetRealtimeChart();
}

async function checkForNewBill() {
    try {
        const res = await fetch(`${API_BASE}/bills/new`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        if (res.ok) {
            const data = await res.json();
            billId = data.id;
            localStorage.setItem('billId', billId);
            chargingStateBtn.classList.remove("disabled");
            chargingStateBtn.classList.add("enabled");
            chargingStateBtn.disabled = false;
        } else {
            alert("Chưa nhận thông tin trạm sạc. Vui lòng chờ...");
            chargingStateBtn.classList.add("disabled");
            chargingStateBtn.classList.remove("enabled");
            chargingStateBtn.disabled = true;
        }
    } catch (err) {
        alert("Vui lòng kết nối lại xe với trạm sạc...");
        chargingStateBtn.classList.add("disabled");
        chargingStateBtn.disabled = true;
    }
}

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

// XỬ LÝ NÚT NHẤN
chargingStateBtn.addEventListener("click", async () => {
    // START 
    if (chargingState === "start") {
        billId = localStorage.getItem('billId');
        if (!billId) {
            alert("Không tìm thấy bill đang sạc!");
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/bills/start/${billId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                mode: 'cors'
            });
            if (!response.ok) {
                const data = await response.json(); // parse JSON
                alert(data.message || "Lỗi: " + response.status);
                return;
            }
            connectWebSocket();  
            chargingState = "stop";
            updateChargingUI();
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server");
        }
    }

    // STOP 
    else if (chargingState === "stop") {
        billId = localStorage.getItem('billId');
        if (!billId) {
            alert("Không tìm thấy bill đang sạc!");
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/bills/pause/${billId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (response.ok) {
                disconnectWebSocket();   // đóng socket khi dừng
                const latestBill = await fetchLatestBill(billId);
                if (latestBill) {
                    currentBillData = latestBill;
                    chargingState = "continue";
                    updateChargingUI();
                    showBillModal(latestBill);  
                    resetRealtimeChart();
                }
            }
        } catch (err) {
            alert("Không thể dừng sạc. Vui lòng thử lại!");
            chargingStateBtn.textContent = "Stop Charging";
            chargingStateBtn.disabled = false;
        }
    }

    // CONTINUE
    else if (chargingState === "continue") {
        billId = localStorage.getItem('billId');
        if (!billId) {
            alert("Không tìm thấy bill đang sạc!");
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/bills/start/${billId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            if (response.ok) {
                connectWebSocket();  
                chargingState = "stop";
                updateChargingUI();
            }
        } catch (err) {
            alert("Lỗi khi tiếp tục sạc");
        }
    }
});

/* ---------- REALTIME CHART -------------- */
let chart = null;
const MAX_DATA_POINTS = 50; 
const labels = [];
const voltageData = [];
const currentData = [];

// ĐỒ THỊ KHI SẠC
function initRealtimeChart() {
    const ctx = document.getElementById('realtimeChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Voltage (V)',
                    data: voltageData,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#00ff88',
                    fill: true,
                    yAxisID: 'y-voltage'
                },
                {
                    label: 'Current (A)',
                    data: currentData,
                    borderColor: '#ff0080',
                    backgroundColor: 'rgba(255, 0, 128, 0.1)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ff0080',
                    fill: true,
                    yAxisID: 'y-current'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Realtime Charging Monitor',
                    color: '#fff',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    labels: { color: '#fff', font: { size: 14 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#aaa', maxTicksLimit: 10 },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                'y-voltage': {
                    type: 'linear',
                    position: 'left',
                    min: 0,
                    max: 5,
                    ticks: { 
                        color: '#00ff88',
                        callback: value => value + ' V'
                    },
                    grid: { color: 'rgba(0,255,136,0.2)' },
                    title: {
                        display: true,
                        text: 'Voltage',
                        color: '#00ff88',
                        font: { size: 14 }
                    }
                },
                'y-current': {
                    type: 'linear',
                    position: 'right',
                    min: 0,
                    max: 200,
                    ticks: { 
                        color: '#ff0080',
                        callback: value => value + ' A'
                    },
                    grid: { drawOnChartArea: false },
                    title: {
                        display: true,
                        text: 'Current',
                        color: '#ff0080',
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

// CẬP NHẬT ĐỒ THỊ
function updateRealtimeChart(voltage, current) {
    const now = new Date().toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });

    labels.push(now);
    voltageData.push(voltage);
    currentData.push(current);

    if (labels.length > MAX_DATA_POINTS) {
        labels.shift();
        voltageData.shift();
        currentData.shift();
    }

    if (chart) {
        chart.update('quiet'); 
    }
}

// RESET ĐỒ THỊ KHI KẾT THÚC SẠC
function resetRealtimeChart() {
    if (chart) {
        chart.destroy();
        chart = null;
    }
    labels.length = 0;
    voltageData.length = 0;
    currentData.length = 0;
    document.querySelector('.chart-summary').innerHTML = '<canvas id="realtimeChart"></canvas>';
}

updateChargingUI();
checkForNewBill();

let currentBillData = null;

// định dạng thời gian
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

// LẤY HÓA ĐƠN 
async function fetchLatestBill(billId) {
    try {
        const response = await fetch(`${API_BASE}/bills/${billId}`, {
            headers: {
                'Authorization': 'Bearer ' + token
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

// HIỂN THỊ HÓA ĐƠN
function showBillModal(bill) {
    if (!bill) return;
    currentBillData = bill;

    document.getElementById('billUserName').textContent = bill.userName || "Khách lẻ";
    document.getElementById('billDescription').textContent = bill.description || "Electricity Bill";
    document.getElementById('billChargerId').textContent = bill.chargerId;

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

// THANH TOÁN HÓA ĐƠN
document.getElementById('submitPaymentBtn').onclick = async () => {
    try {
        const res = await fetch(`${API_BASE}/bills/paid/${billId}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
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
            location.reload();
        } else {
            alert("Thanh toán thất bại. Vui lòng thử lại!");
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
};

// NHẤN NÚT THANH TOÁN
paymentBtn.onclick = async () => {
    if (!billId) {
        alert("Không có hóa đơn nào để xem!");
        return;
    }
    const latestBill = await fetchLatestBill(billId);
    if (latestBill) showBillModal(latestBill);
};

// /* GOOGLE MAP INTEGRATION */
// let map;
// let markers = [];
// let infoWindows = [];

// // Khởi tạo bản đồ
// function initGoogleMap() {
//     map = new google.maps.Map(document.getElementById("googleMap"), {
//         zoom: 11,
//         center: { lat: 10.762622, lng: 106.660172 },
//         mapTypeId: "roadmap",
//         styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }]
//     });

//     loadManagerLocations();
// }

// // TẢI DANH SÁCH MANAGER 
// async function loadManagerLocations() {
//     try {
//         const token = localStorage.getItem('jwtToken');
//         const res = await fetch(`${API_BASE}/charger/map-locations`, {
//             headers: { 'Authorization': 'Bearer ' + token }
//         });

//         if (!res.ok) throw new Error();
//         const locations = await res.json();

//         locations.forEach(loc => {
//             if (!loc.latitude || !loc.longitude) return;

//             const marker = new google.maps.Marker({
//                 position: { lat: loc.latitude, lng: loc.longitude },
//                 map: map,
//                 icon: {
//                     url: loc.status === "active" 
//                         ? "https://img.icons8.com/fluency/48/electricity.png"
//                         : "https://img.icons8.com/color/48/no-electricity.png",
//                     scaledSize: new google.maps.Size(50, 50)
//                 },
//                 title: loc.stationName
//             });

//             // Tạo InfoWindow (chưa mở)
//             const infoWindow = new google.maps.InfoWindow();

//             // KHI CLICK → GỌI API LẤY CHI TIẾT THEO managerId (ẨN TRONG DATA)
//             marker.addListener("click", async () => {
//                 // Đóng tất cả infoWindow cũ
//                 infoWindows.forEach(iw => iw.close());
//                 infoWindows = [];
//                 try {
//                     const detailRes = await fetch(`${API_BASE}/charger/manager/${loc.managerId}`, {
//                         headers: { 'Authorization': 'Bearer ' + token }
//                     });

//                     if (!detailRes.ok) throw new Error();

//                     const chargers = await detailRes.json();

//                     const chargerList = chargers.map(c => 
//                         `<li style="margin:4px 0; padding:8px; background:#f8f9fa; border-radius:8px;">
//                             <strong>${c.chargerName}</strong> - ${c.status === 'AVAILABLE' ? 'Trống' : 'Đang sạc'}
//                          </li>`
//                     ).join('');

//                     infoWindow.setContent(`
//                         <div style="font-family:Arial; min-width:280px; max-height:400px; overflow-y:auto;">
//                             <p style="margin:4px 0; color:#555;"><strong>Địa chỉ:</strong> ${loc.address}</p>
//                             <p style="margin:8px 0; color:#0f9d58; font-weight:bold;">
//                                 Tổng: ${chargers.length} cổng sạc
//                             </p>
//                             <details style="margin-top:10px;">
//                                 <summary style="cursor:pointer; color:#1a73e8; font-weight:bold;">Xem chi tiết</summary>
//                                 <ul style="margin:8px 0; padding-left:20px;">${chargerList}</ul>
//                             </details>
//                             <div style="margin-top:10px; text-align:center;">
//                                 <button onclick="navigateToCharger(${loc.address})" 
//                                         style="background:#1a73e8; color:white; border:none; padding:10px 16px; border-radius:8px; cursor:pointer;">
//                                     Chỉ đường đến đây
//                                 </button>
//                             </div>
//                         </div>
//                     `);

//                     infoWindow.open(map, marker);
//                     infoWindows.push(infoWindow);

//                 } catch (err) {
//                     infoWindow.setContent(`<p style="color:red;">Không tải được thông tin trạm!</p>`);
//                     infoWindow.open(map, marker);
//                 }
//             });

//             markers.push(marker);
//         });

//     } catch (err) {
//         console.error(err);
//         document.getElementById("googleMap").innerHTML = "<p style='text-align:center;padding:50px;color:#999;'>Không tải được bản đồ</p>";
//     }
// }

// // Hàm chỉ đường (tùy chọn)
// function navigateToCharger(managerId) {
//     alert("Đang mở Google Maps chỉ đường đến trạm này...");
// }

// document.addEventListener("DOMContentLoaded", () => {
//     if (document.getElementById("googleMap")) {
//         setTimeout(initGoogleMap, 800);
//     }
// });

/* --------------- WALLET & HISTORY –---------------- */

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

let currentUserBankAccounts = []; 

// THÔNG TIN NGƯỜI DÙNG
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_BASE}/profile`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error();
        const data = await res.json();
        document.querySelector('.wallet-card h2').textContent = data.fullname || "User";
        document.querySelector('.wallet-card p').textContent = `Balance: ${formatvnd(data.balance || 0)}`;
    } catch (err) {
        console.error("Lỗi load profile");
    }
}

// TẢI DANH SÁCH NGÂN HÀNG
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

// TẢI DANH SÁCH TÀI KHOẢN LIÊN KẾT
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

// LIÊN KẾT TÀI KHOẢN 
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

        const contentType = res.headers.get("content-type");
        let responseData = null;
        if (contentType && contentType.includes("application/json")) {
            responseData = await res.json();
        } else {
            responseData = await res.text();
        }

        if (res.ok) {
            alert("Liên kết tài khoản thành công!");
            accountNumber.value = "";
            accountName.value = "";
            bankSelect.value = "";
            bankForm.style.display = "none";
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

// XÓA TÀI KHOẢN 
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

    if (e.target.closest('.option') && !e.target.classList.contains('accountdelete')) {
        const option = e.target.closest('.option');
        selectedAccount.textContent = option.querySelector('span').textContent;
        selectedAccount.dataset.accountId = option.dataset.accountId;
        optionsContainer.style.display = 'none';
    }
});

// TẠO HÓA ĐƠN
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
            alert(`${isDeposit ? "Nạp" : "Rút"} tiền thành công ${formatvnd(amount)}!`);
            amountInput.value = "";
            amountForm.style.display = "none";
            loadUserProfile(); 
            if (historyTab.classList.contains('active')) {
                loadHistoryBills(); 
            }
        } else {
            alert(`${isDeposit ? "Nạp" : "Rút"} tiền thất bại!`);
        }
    } catch (err) {
        alert("Lỗi kết nối server");
    }
});

// LỊCH SỬ GIAO DỊCH
const ITEMS_PER_PAGE = 10; 
let currentPage = 1;
let billsData = []; 

function renderBillPage(page) {
    const container = document.querySelector('.history-list');
    container.innerHTML = "";

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = billsData.slice(start, end);

    if (pageItems.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999;'>Chưa có giao dịch nào</p>";
        return;
    }

    pageItems.forEach(bill => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.billId = bill.id;
        div.dataset.billType = bill.billType;

        div.innerHTML = `
            <span>${bill.userName || bill.cardHolderName || "Bạn"}</span>
            <span>${bill.id}</span>
            <span>${bill.description}</span>
            <span>${formatvnd(bill.amount)}</span>
            <span>${new Date(bill.paidAt).toLocaleDateString('vi-VN')}</span>
            <span id="billdetail"><i class="fa-solid fa-eye"></i></span>
        `;
        container.appendChild(div);
    });

    renderPagination();
}

// phân trang
function renderPagination() {
    const pagination = document.getElementById('billPagination');
    pagination.innerHTML = "";
    const totalPages = Math.ceil(billsData.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.textContent = "<";
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; renderBillPage(currentPage); };
    pagination.appendChild(prev);

    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, currentPage + 1);
    if (currentPage === 1) endPage = Math.min(totalPages, 3);
    if (currentPage === totalPages) startPage = Math.max(1, totalPages - 2);

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => { currentPage = i; renderBillPage(currentPage); };
        pagination.appendChild(btn);
    }

    const next = document.createElement('button');
    next.textContent = ">";
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; renderBillPage(currentPage); };
    pagination.appendChild(next);
}

async function loadHistoryBills() {
    try {
        const res = await fetch(`${API_BASE}/bills/all/user`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        if (!res.ok) throw new Error();
        billsData = await res.json();
        currentPage = 1;
        renderBillPage(currentPage);

        const container = document.querySelector('.history-list');
        container.addEventListener('click', async (e) => {
            const eye = e.target.closest('#billdetail');
            if (!eye) return;

            const billItem = eye.closest('.history-item');
            const billId = billItem.dataset.billId;
            const billType = billItem.dataset.billType;
            await showBillDetail(billId, billType);
        });

    } catch (err) {
        console.error(err);
        document.querySelector('.history-list').innerHTML = "<p style='color:red;'>Lỗi tải lịch sử giao dịch</p>";
    }
}

window.addEventListener('DOMContentLoaded', loadHistoryBills);

// ĐỊNH DẠNG THỜI GIAN
function formatChargingTime(hours) {
    if (!hours || hours <= 0) return "0 giây";

    const totalSeconds = Math.round(hours * 3600);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}<small>h</small>`);
    if (m > 0 || h > 0) parts.push(`${m}<small>m</small>`); 
    parts.push(`${s}<small>s</small>`);

    return parts.join(' ');
}

// CHI TIẾT HÓA ĐƠN
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
                  <span style="font-size:1.4em; font-weight:bold; color:#d32f2f;">${formatvnd(bill.amount)}</span>
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
                  <span style="font-size:1.4em; font-weight:bold; color:#2e7d32;">${formatvnd(bill.amount)}</span>
                </div>
            `;
        }

        document.getElementById('billDetailContent').innerHTML = html;
        document.getElementById('billDetailOverlay').style.display = 'flex';

    } catch (err) {
        alert("Không thể tải chi tiết giao dịch!");
    }
}

// ĐÓNG MODAL 
document.getElementById('billDetailOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('billDetailOverlay')) {
        document.getElementById('billDetailOverlay').style.display = 'none';
    }
});

// ĐỊNH DẠNG TIỀN 
function formatvnd(amount) {
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

// HIỂN THỊ NGÂN HÀNG
bankSelect.addEventListener('change', () => {
    bankForm.style.display = bankSelect.value ? 'block' : 'none';
});

// NHẬP SỐ TIỀN
[depositBtn, withdrawBtn].forEach(btn => {
    btn.addEventListener('click', () => {
        depositBtn.classList.toggle('active', btn === depositBtn);
        withdrawBtn.classList.toggle('active', btn === withdrawBtn);
        amountForm.style.display = 'block';
    });
});

// ĐÓNG DROPDOWN
document.addEventListener('click', (e) => {
    if (!document.querySelector('.account-dropdown').contains(e.target)) {
        optionsContainer.style.display = 'none';
    }
});

// MỞ DROPDOWN
selectedAccount.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
});

// TẢI DỮ LIỆU TAB WALLET
document.addEventListener("DOMContentLoaded", () => {
    if (walletTab.classList.contains('active')) {
        loadUserProfile();
        loadBanks();
        loadLinkedAccounts();
    }
});

walletBtn?.addEventListener("click", () => {
    setTimeout(() => {
        loadUserProfile();
        loadBanks();
        loadLinkedAccounts();
    }, 100);
});

function renderCommonPagination(totalItems, pageSize, currentPage, containerId, changePageCallback) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const container = document.getElementById(containerId);

  if (totalPages <= 1 || totalItems === 0) {
    container.innerHTML = '';
    return;
  }

  let html = `<button onclick="${changePageCallback.name}(${currentPage - 1})" 
                     ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
              </button>`;

  const startPage = Math.max(1, currentPage - 3);
  const endPage   = Math.min(totalPages, currentPage + 3);

  if (startPage > 1) {
    html += `<button onclick="${changePageCallback.name}(1)">1</button>`;
    if (startPage > 2) html += `<span>...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button onclick="${changePageCallback.name}(${i})" 
                     ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span>...</span>`;
    html += `<button onclick="${changePageCallback.name}(${totalPages})">${totalPages}</button>`;
  }

  html += `<button onclick="${changePageCallback.name}(${currentPage + 1})" 
                   ${currentPage === totalPages ? 'disabled' : ''}>
             <i class="fas fa-chevron-right"></i>
           </button>`;

  container.innerHTML = html;
}
//localStorage.clear();