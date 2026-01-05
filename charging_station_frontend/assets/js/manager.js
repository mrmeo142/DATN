'use strict';

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1])); 
        const now = Date.now() / 1000; // giây
        return payload.exp < now; 
    } catch (e) {
        return true; // token không hợp lệ
    }
}

// function handleLogout() {
//     localStorage.removeItem('jwtToken');
//     localStorage.removeItem('userFullName');
//     localStorage.removeItem('userRole');
//     localStorage.removeItem('userId');
//     window.location.href = 'index.html';
// }

// Lấy token từ localStorage
const token = localStorage.getItem('jwtToken');

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
console.log(token);

if (!token || isTokenExpired(token)) {
    handleLogout(); // token hết hạn → logout
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

// ------------ PHÂN TRANG -----------
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

/* ----------------- CHARGER TAB –--------------- */
let allChargers = [];
let filteredChargers = [];
let currentChargerPage = 1;
const chargersPerPage = 2;

// Load danh sách trạm sạc
async function loadChargers() {
    try {
        const res = await fetch(`${API_BASE}/charger/manager`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Lỗi server');
        const data = await res.json();
        allChargers = Array.isArray(data) ? data : [];
        filteredChargers = [...allChargers];

        document.getElementById('totalChargers').textContent = filteredChargers.length;
        renderChargerTable();

    } catch (err) {
        alert('Lỗi tải danh sách trạm sạc');
        console.error(err);
    }
}

// Render danh sách trạm sạc
function renderChargerTable() {
    const container = document.getElementById('chargerGridBody');
    const start = (currentChargerPage - 1) * chargersPerPage;
    const end = start + chargersPerPage;
    const pageData = filteredChargers.slice(start, end);

    if (pageData.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px;color:#999;">Không có trạm nào</div>';
        document.getElementById('chargerPagination').innerHTML = '';
        return;
    }

    container.innerHTML = pageData.map(charger => {
        const status = charger.status || 'UNKNOWN';
        const isMaintenance = status === 'MAINTENANCE';

        return `
            <div class="charger-grid-row">
                <div><code>${charger.id}</code></div>
                <div><span>${status}</span></div>
                <div class="charger-actions">
                    <button class="charger-btn btn-view-charger" onclick="viewCharger('${charger.id}')">Xem</button>
                    <button class="charger-btn ${isMaintenance ? 'btn-off' : 'btn-maintenance'}"
                            onclick="${isMaintenance ? `setChargerOff('${charger.id}')` : `setChargerMaintenance('${charger.id}')`}">
                        ${isMaintenance ? 'Bật' : 'Bảo trì'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    renderCommonPagination(filteredChargers.length,chargersPerPage,currentChargerPage,'chargerPagination',ChargerPage
    );
}

function ChargerPage(page) {
  const totalPages = Math.ceil(filteredChargers.length / chargersPerPage);
  if (page < 1 || page > totalPages) return;
  currentChargerPage = page;
  renderChargerTable();
}

// Xem chi tiết
async function viewCharger(id) {
    try {
        const res = await fetch(`${API_BASE}/charger/${id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const c = await res.json();

        document.getElementById('chargerDetailBody').innerHTML = `
            <p><strong>ID:</strong> <code>${c.id}</code></p>
            <p><strong>Trạng thái:</strong><code>${c.status}</code></p>
            <p><strong>Tiến trình:</strong> ${c.process || '—'}</p>
        `;
        document.getElementById('chargerDetailModal').style.display = 'flex';
    } catch (err) {
        alert('Lỗi tải chi tiết');
    }
}

function closeChargerDetail() {
    document.getElementById('chargerDetailModal').style.display = 'none';
}

// Cập nhật trạng thái
async function setChargerMaintenance(id) {
    await updateChargerStatus(id, '/charger/update/');
}

async function setChargerOff(id) {
    await updateChargerStatus(id, '/charger/active/');
}

async function updateChargerStatus(id, endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}${id}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            alert('Cập nhật thành công!');
            location.reload();
        } else {
            alert('Cập nhật thất bại');
        }
    } catch (err) {
        alert('Lỗi kết nối');
    }
}

// Lọc trạng thái
document.getElementById('filterChargerStatus')?.addEventListener('change', function() {
    const s = this.value;
    filteredChargers = s ? allChargers.filter(c => c.status === s) : [...allChargers];
    currentChargerPage = 1;
    renderChargerTable();
});


let allBills = [];
let filteredBills = [];
let currentBillPage = 1;
const billsPerPage = 3;

// Tải danh sách hóa đơn
async function loadBills() {
  try {
    const res = await fetch(`${API_BASE}/bills/all/mng`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error('Lỗi server');
    const data = await res.json();
    allBills = Array.isArray(data) ? data : [];
    filteredBills = [...allBills];
    document.getElementById('totalBills').textContent = filteredBills.length;
    calculateRevenue();
    renderBillTable();

  } catch (err) {
    alert('Lỗi tải danh sách hóa đơn');
    console.error(err);
  }
}

// Tính tổng doanh thu
function calculateRevenue() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);

  let total = 0, todayTotal = 0, monthTotal = 0, yearTotal = 0;

  filteredBills.forEach(bill => {
    const amount = bill.amount || 0;
    total += amount;

    if (bill.paidAt) {
      const paidDate = new Date(bill.paidAt);
      if (paidDate >= today) todayTotal += amount;
      if (paidDate >= thisMonth) monthTotal += amount;
      if (paidDate >= thisYear) yearTotal += amount;
    }
  });

  const format = n => n.toLocaleString('vi-VN') + ' ₫';

  document.getElementById('totalRevenue').textContent = format(total);
  document.getElementById('todayRevenue').textContent = format(todayTotal);
  document.getElementById('monthRevenue').textContent = format(monthTotal);
  document.getElementById('yearRevenue').textContent = format(yearTotal);
}

// Render danh sách hóa đơn
function renderBillTable() {
  const container = document.getElementById('billGridBody');
  const start = (currentBillPage - 1) * billsPerPage;
  const end = start + billsPerPage;
  const pageData = filteredBills.slice(start, end);

  if (pageData.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px;color:#999;">Không có hóa đơn nào</div>';
    document.getElementById('billPagination').innerHTML = '';
    return;
  }

  container.innerHTML = pageData.map(bill => {
    const date = bill.paidAt ? new Date(bill.paidAt).toLocaleString('vi-VN') : '—';
    return `
      <div class="bill-grid-row">
        <div><code>${bill.id.slice(-8)}</code></div>
        <div class="bill-amount">${(bill.amount || 0).toLocaleString('vi-VN')} ₫</div>
        <div><strong>${bill.userName || '—'}</strong></div>
        <div>${date}</div>
        <div class="bill-actions">
          <button class="btn-view-bill" onclick="viewBill('${bill.id}')">Xem</button>
        </div>
      </div>
    `;
  }).join('');

  renderCommonPagination(filteredBills.length, billsPerPage, currentBillPage, 'billPagination', billPage);
}

function billPage(page) {
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  if (page < 1 || page > totalPages) return;
  currentBillPage = page;
  renderBillTable();
}

// Chi tiết hóa đơn
async function viewBill(billId) {
  try {
    const res = await fetch(`${API_BASE}/bills/${billId}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const bill = await res.json();

    document.getElementById('billDetailBody').innerHTML = `
      <p><strong>ID hóa đơn:</strong> <code>${bill.id}</code></p>
      <p><strong>Khách hàng:</strong> ${bill.userName || '—'}</p>
      <p><strong>Số tiền:</strong> <strong style="color:#27ae60;font-size:20px;">${(bill.amount || 0).toLocaleString('vi-VN')} ₫</strong></p>
      <p><strong>Thời gian thanh toán:</strong> ${bill.paidAt ? new Date(bill.paidAt).toLocaleString('vi-VN') : '—'}</p>
      <p><strong>Trạng thái:</strong> ${bill.paid}</p>
      <hr>
      <p><strong>Trạm sạc:</strong> ${bill.chargerId || '—'}</p>
      <p><strong>Thời lượng sạc:</strong> ${formatTotalTime(bill.totalTime)}</p>
    `;

    document.getElementById('billDetailModal').style.display = 'flex';
  } catch (err) {
    alert('Lỗi tải chi tiết hóa đơn');
  }
}

function closeBillDetail() {
  document.getElementById('billDetailModal').style.display = 'none';
}

// CHUYỂN GIỜ
function formatTotalTime(hoursDecimal) {
  if (!hoursDecimal && hoursDecimal !== 0) return '—';

  const totalSeconds = Math.round(hoursDecimal * 3600); 
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h} giờ`);
  if (m > 0 || h > 0) parts.push(`${m} phút`); 
  parts.push(`${s} giây`);

  return parts.join(' ');
}

// LỌC THEO THỜI GIAN
document.getElementById('filterTime')?.addEventListener('change', applyBillFilter);
document.getElementById('customDate')?.addEventListener('change', applyBillFilter);

function applyBillFilter() {
  const filterType = document.getElementById('filterTime').value;
  const customDateInput = document.getElementById('customDate');
  const selectedDate = customDateInput.value; 
  customDateInput.style.display = filterType === 'custom' ? 'inline-block' : 'none';

  if (filterType === 'all') {
    filteredBills = [...allBills];
  } 
  else if (filterType === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filteredBills = allBills.filter(bill => {
      if (!bill.paidAt) return false;
      const paidDate = new Date(bill.paidAt);
      paidDate.setHours(0, 0, 0, 0);
      return paidDate.getTime() === today.getTime();
    });
  } 
  else if (filterType === 'thisMonth') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    filteredBills = allBills.filter(bill => {
      if (!bill.paidAt) return false;
      return new Date(bill.paidAt) >= startOfMonth;
    });
  } 
  else if (filterType === 'thisYear') {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    filteredBills = allBills.filter(bill => {
      if (!bill.paidAt) return false;
      return new Date(bill.paidAt) >= startOfYear;
    });
  } 
  else if (filterType === 'custom' && selectedDate) {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    filteredBills = allBills.filter(bill => {
      if (!bill.paidAt) return false;
      const paidDate = new Date(bill.paidAt);
      paidDate.setHours(0, 0, 0, 0);
      return paidDate.getTime() === selected.getTime();
    });
  } 
  else {
    filteredBills = [...allBills]; 
  }

  currentBillPage = 1;
  calculateRevenue();
  renderBillTable();
}

const pages = {
    chargerBtn: document.querySelector(".charger-page"),
    billBtn:    document.querySelector(".bill-page"),
    messageBtn: document.querySelector(".message-page"),
};

function switchPage(targetPage, clickedItem) {
    document.querySelectorAll('.charger-page, .bill-page')
        .forEach(p => p.style.display = 'none');

    if (targetPage) {
        targetPage.style.display = 'flex'; 
    }
    document.querySelectorAll(".sidebar-left nav li").forEach(li => li.classList.remove('active'));
    if (clickedItem) clickedItem.classList.add('active');
}

document.querySelector(".sidebar-left nav li:nth-child(1)")?.addEventListener("click", function() {
    switchPage(pages.chargerBtn, this);
    loadChargers(); 
});

document.querySelector(".sidebar-left nav li:nth-child(2)")?.addEventListener("click", function() {
    switchPage(pages.billBtn, this);
    loadBills();
});

document.addEventListener("DOMContentLoaded", () => {
    switchPage(pages.chargerBtn, document.querySelector(".sidebar-left nav li:nth-child(1)"));
    loadChargers(); 
});