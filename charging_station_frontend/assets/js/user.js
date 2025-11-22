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
        const res = await fetch('http://localhost:8080/profile', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Không lấy được thông tin người dùng');

        const user = await res.json();

        // Điền thông tin vào form
        personalForm.fullName.value = user.fullname || '';
        personalForm.email.value = user.email || '';
        personalForm.password.value = '**********';
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
            const res = await fetch('http://localhost:8080/update', {
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
const vehicleModal = document.getElementById("vehicleModal");
const addVehicleBtn = document.getElementById("addVehicleBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const saveVehicleBtn = document.getElementById("saveVehicleBtn");
const vehicleType = document.getElementById("vehicleType");
const licensePlate = document.getElementById("licensePlate");
const modalTitle = document.getElementById("modalTitle");

let editingRow = null;

addVehicleBtn.addEventListener("click", () => {
  editingRow = null;
  modalTitle.textContent = "Add Vehicle";
  vehicleType.value = "EV Car";
  licensePlate.value = "";
  vehicleModal.style.display = "flex";
});

cancelModalBtn.addEventListener("click", () => {
  vehicleModal.style.display = "none";
});

saveVehicleBtn.addEventListener("click", () => {
  if (editingRow) {
    editingRow.children[0].textContent = vehicleType.value;
    editingRow.children[1].textContent = licensePlate.value;
  } else {
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
      <td>${vehicleType.value}</td>
      <td>${licensePlate.value}</td>
      <td>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </td>`;
    document.getElementById("vehicleTableBody").appendChild(newRow);
  }
  vehicleModal.style.display = "none";
});

document.getElementById("vehicleTableBody").addEventListener("click", (e) => {
  const row = e.target.closest("tr");
  if (e.target.classList.contains("edit-btn")) {
    editingRow = row;
    modalTitle.textContent = "Edit Vehicle";
    vehicleType.value = row.children[0].textContent;
    licensePlate.value = row.children[1].textContent;
    vehicleModal.style.display = "flex";
  }
  if (e.target.classList.contains("delete-btn")) {
    row.remove();
  }
});


/* ========== REGISTRATION LOGIC ========== */
const registerBtn = document.getElementById("registration-form");
const statusEl = document.getElementById("registrationStatus");

registerBtn.addEventListener("click", function(e) {
  e.preventDefault();
  registerBtn.style.display = "none";
  setRegistrationStatus("pending");
});

function setRegistrationStatus(status) {
  statusEl.style.display = "inline-block";
  statusEl.className = "registration-status " + status;
  statusEl.textContent = status === "approved" ? "Approved" : "Pending";
}


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

/* ========== wallet & history section ========== */
const walletTab = document.getElementById('walletTab');
  const historyTab = document.getElementById('historyTab');
  const walletSection = document.querySelector('.wallet-section');
  const historySection = document.querySelector('.history-section');

  walletTab.addEventListener('click', () => {
    walletTab.classList.add('active');
    historyTab.classList.remove('active');
    walletSection.classList.add('active');
    historySection.classList.remove('active');
  });

  historyTab.addEventListener('click', () => {
    historyTab.classList.add('active');
    walletTab.classList.remove('active');
    historySection.classList.add('active');
    walletSection.classList.remove('active');
  });

  // Bank select
  const bankSelect = document.getElementById('bankSelect');
  const bankForm = document.getElementById('bankForm');
  bankSelect.addEventListener('change', () => {
    bankForm.style.display = bankSelect.value ? 'block' : 'none';
  });

  // Custom account dropdown
  const dropdown = document.querySelector('.account-dropdown');
  const selected = dropdown.querySelector('.selected');
  const optionsContainer = dropdown.querySelector('.options');

  selected.addEventListener('click', () => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
  });

  optionsContainer.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', (e) => {
      if(e.target.classList.contains('accountdelete-btn')) return;
      selected.textContent = option.firstChild.textContent.trim();
      optionsContainer.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      optionsContainer.style.display = 'none';
    });

    const deleteBtn = option.querySelector('.accountdelete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const accountName = option.firstChild.textContent.trim();
      if(confirm(`Delete account "${accountName}"?`)) {
        option.remove();
        if(selected.textContent === accountName) {
          selected.textContent = "-- Choose Account --";
        }
      }
    });
  });

  document.addEventListener('click', (e) => {
    if(!dropdown.contains(e.target)) {
      optionsContainer.style.display = 'none';
    }
  });

  // Transaction method
  const deposit = document.getElementById('deposit');
  const withdraw = document.getElementById('withdraw');
  const amountForm = document.getElementById('amountForm');

  [deposit, withdraw].forEach(btn => {
    btn.addEventListener('click', () => {
      deposit.classList.remove('active');
      withdraw.classList.remove('active');
      btn.classList.add('active');
      amountForm.style.display = 'block';
    });
  });
//localStorage.clear();