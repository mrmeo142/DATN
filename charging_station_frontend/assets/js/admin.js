'use strict';

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
    handleLogout(); 
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

/* ----------------- NAVIGATION --------------- */
const menuItems = document.querySelectorAll(".sidebar-left nav li");

const pages = {
  backaccBtn:   document.querySelector(".main-content"), 
  userBtn:      document.querySelector(".user-page"),
  managerBtn:   document.querySelector(".manager-page"),
  chargerBtn:   document.querySelector(".charger-page"),
  promotionBtn: document.querySelector(".promotion-page")
};

// Hàm chuyển trang 
function switchPage(targetPageElement, clickedButton) {
  Object.values(pages).forEach(page => {
    if (page) page.style.display = "none";
  });

  if (targetPageElement) {
    targetPageElement.style.display = "flex"; 
  }

  menuItems.forEach(item => item.classList.remove("active"));

  if (clickedButton) {
    clickedButton.classList.add("active");
  }
}

document.querySelector(".sidebar-left nav li:nth-child(1)").addEventListener("click", function() {
  switchPage(pages.backaccBtn, this);
});

document.querySelector(".sidebar-left nav li:nth-child(2)").addEventListener("click", function() {
  switchPage(pages.userBtn, this);
  loadUsers?.(); 
});

document.querySelector(".sidebar-left nav li:nth-child(3)").addEventListener("click", function() {
  switchPage(pages.managerBtn, this);
  loadManagers();
});

document.querySelector(".sidebar-left nav li:nth-child(4)").addEventListener("click", function() {
  switchPage(pages.chargerBtn, this);
  loadChargers(); 
});

document.querySelector(".sidebar-left nav li:nth-child(5)").addEventListener("click", function() {
  switchPage(pages.promotionBtn, this);
  loadPromotions();
});

document.addEventListener("DOMContentLoaded", () => {
  switchPage(pages.backaccBtn, document.querySelector(".sidebar-left nav li:nth-child(1)"));
});

// --------------- TAB BANK & PRICE ---------------
let allBanks = [];
let allBankAccounts = [];
let currentBankId = null;
let currentBankPage = 1;
const banksPerPage = 4;

document.addEventListener('DOMContentLoaded', () => {
  loadBanks();
  loadPrice();
  loadAllBankAccounts();

  document.getElementById('bankDropdown').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('bankList').classList.toggle('show');
  });

  // Thêm ngân hàng
  document.getElementById('addBankBtn').addEventListener('click', () => openBankModal());

  // Cập nhật giá
  document.getElementById('updatePriceBtn').addEventListener('click', () => {
    document.getElementById('priceModal').style.display = 'flex';
  });

  // Đóng modal
  document.querySelectorAll('.close, .btn-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').style.display = 'none';
    });
  });

  document.getElementById('submitBankBtn').addEventListener('click', saveBank);
  document.getElementById('submitPriceBtn').addEventListener('click', updatePrice);

  // đóng dropdown
  document.addEventListener('click', () => {
    document.getElementById('bankList').classList.remove('show');
  });
});

async function loadBanks() {
  try {
    const res = await fetch(`${API_BASE}/bank/all`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    allBanks = await res.json();
    renderBankList();
  } catch (err) { console.error(err); }
}

// ---------- HÀM RENDER DANH SÁCH NGÂN HÀNG -----------
function renderBankList() {
  const list = document.getElementById('bankList');

  let html = `
    <div class="bank-item" onclick="selectBank(null)">
      <span><strong>Tất cả ngân hàng</strong></span>
      <div class="bank-actions"></div>
    </div>
  `;

  html += allBanks.map(bank => `
    <div class="bank-item" onclick="selectBank('${bank.id}')">
      <span>${bank.bankName}</span>
      <div class="bank-actions">
        <button class="btn-edit" onclick="event.stopPropagation(); openBankModal('${bank.id}', '${bank.bankName}')">
          Sửa
        </button>
        <button class="btn-delete" onclick="event.stopPropagation(); deleteBank('${bank.id}')">
          Xóa
        </button>
      </div>
    </div>
  `).join('');

  list.innerHTML = html;
}

function selectBank(bankId) {
  currentBankId = bankId || null;
  const selectedName = bankId 
    ? allBanks.find(b => b.id === bankId)?.name || 'Không xác định'
    : 'Tất cả ngân hàng';
  
  document.querySelector('#bankDropdown span').textContent = selectedName;
  currentPage = 1;
  renderTable();
  document.getElementById('bankList').classList.remove('show');
}

async function loadPrice() {
  try {
    const res = await fetch(`${API_BASE}/price/get`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    document.getElementById('currentPrice').textContent = `${data.price.toLocaleString()} VND/kWh`;
  } catch (err) { console.error(err); }
}

async function updatePrice() {
  const price = document.getElementById('newPrice').value;
  if (!price) return alert('Vui lòng nhập giá');
  
  await fetch(`${API_BASE}/price/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ price: parseInt(price) })
  });
  document.getElementById('priceModal').style.display = 'none';
  reloadCurrentTab();
}

function openBankModal(id = null, name = '') {
  const modal = document.getElementById('bankModal');
  const title = document.getElementById('modalTitle');
  const submitBtn = document.getElementById('submitBankBtn');
  
  if (id) {
    document.getElementById('editBankId').value = id;
    document.getElementById('bankName').value = name;
    title.textContent = 'Sửa ngân hàng';
    submitBtn.textContent = 'Cập nhật';
  } else {
    document.getElementById('editBankId').value = '';
    document.getElementById('bankName').value = '';
    title.textContent = 'Thêm ngân hàng mới';
    submitBtn.textContent = 'Thêm mới';
  }
  modal.style.display = 'flex';
}

async function saveBank() {
  const id = document.getElementById('editBankId').value;
  const name = document.getElementById('bankName').value.trim();
  if (!name) return alert('Vui lòng nhập tên ngân hàng');

  const url = id ? `/bank/update/${id}` : '/bank/create';
  const method = id ? 'PUT' : 'POST';
  const body = id ? { id, bankName: name } : { bankName: name };

  await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(body)
  });

  document.getElementById('bankModal').style.display = 'none';
  reloadCurrentTab();
}

async function deleteBank(id) {
  if (!confirm('Xóa ngân hàng này?')) return;
  await fetch(`${API_BASE}/bank/delete/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  reloadCurrentTab();
}

async function loadAllBankAccounts() {
  const res = await fetch(`${API_BASE}/bankAccount/all/admin`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  allBankAccounts = await res.json();
  renderTable();
}

// ---------- RENDER DANH SÁCH TÀI KHOẢN -----------
function renderTable() {
  const tbody = document.getElementById('bankAccountTableBody');
  const start = (currentBankPage - 1) * banksPerPage;
  const end = start + banksPerPage;
  let data = allBankAccounts;
  if (currentBankId) {
    data = allBankAccounts.filter(acc => acc.bankId === currentBankId);
  }

  document.getElementById('totalRecords').textContent = data.length;

  tbody.innerHTML = data.slice(start, end).map((acc, i) => {
    return `
      <tr>
        <td>${start + i + 1}</td>
        <td>${acc.bankName || '<span style="color:#999">null</span>'}</td>
        <td>${acc.accountNumber || '<span style="color:#999">null</span>'}</td>
        <td>${acc.accountHolderName || '<span style="color:#999">null</span>'}</td>
        <td>
          <span>
            ${acc.balance != null ? acc.balance.toLocaleString('vi-VN') + ' VND' : 'null'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  renderCommonPagination(data.length, banksPerPage, currentBankPage, 'bankPagination', changeBankPage);
}

function changeBankPage(page) {
  if (page < 1 || page > Math.ceil(allBankAccounts.length / banksPerPage)) return;
  currentBankPage = page;
  renderTable();
}

function selectBank(bankId) {
  currentBankId = bankId;
  document.querySelector('#bankDropdown span').textContent = 
    allBanks.find(b => b.id === bankId)?.name || 'Tất cả ngân hàng';
  currentBankPage = 1;
  renderTable();
}

// ----------- DANH SÁCH TẤT CẢ TÀI KHOẢN NGƯỜI DÙNG -----------------
let allUsers = [];
let filteredUsers = [];
let currentUserPage = 1;
const usersPerPage = 2;

function loadUsers() {
  fetch(`${API_BASE}/all`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(data => {
    allUsers = data;
    filteredUsers = data;
    renderUserTable();
  })
  .catch(err => console.error('Lỗi load user:', err));
}

function renderUserTable() {
  const container = document.getElementById('userGridBody');
  const start = (currentUserPage - 1) * usersPerPage;
  const end = start + usersPerPage;
  const data = filteredUsers.slice(start, end);

  document.getElementById('totalUsers').textContent = filteredUsers.length;

  container.innerHTML = data.map(user => {
    const roleText = user.role === 0 ? 'User' : user.role === 1 ? 'Admin' : 'Manager';
    const roleClass = `role-badge role-${user.role}`;
    const birth = user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '—';

    return `
      <div class="user-grid-row">
        <div>${user.id?.slice(-8) || '—'}</div>
        <div>${user.fullname || '—'}</div>
        <div>${user.email || '—'}</div>
        <div>${birth}</div>
        <div>${user.phone || '—'}</div>
        <div><span class="${roleClass}">${roleText}</span></div>
        <div class="action-buttons">
          <button class="action-btn btn-view" onclick="viewUserDetail('${user.id}')">Xem</button>
          <button class="action-btn btn-delete" onclick="deleteUser('${user.id}')">Xóa</button>
        </div>
      </div>
    `;
  }).join('');

  renderCommonPagination(filteredUsers.length, usersPerPage, currentUserPage, 'userPagination', changeUserPage);
}

function changeUserPage(page) {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  if (page < 1 || page > totalPages) return;
  currentUserPage = page;
  renderUserTable();
}

// Tìm kiếm + lọc
document.getElementById('searchName').addEventListener('input', filterUsers);
document.getElementById('roleFilter').addEventListener('change', filterUsers);

function filterUsers() {
  const query = document.getElementById('searchName').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;

  filteredUsers = allUsers.filter(user => {
    const matchName = user.fullname?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
    const matchRole = role === '' || user.role === parseInt(role);
    return matchName && matchRole;
  });

  currentUserPage = 1;
  renderUserTable();
}

// ------------ XEM CHI TIẾT THÔNG TIN USER ------------
function viewUserDetail(userId) {
  fetch(`${API_BASE}/profile/${userId}`, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => res.json())
  .then(user => {
    const birth = user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '—';
    let vehiclesHTML = '';
    if (user.vehicles && user.vehicles.length > 0) {
      vehiclesHTML = user.vehicles.map((v, index) => {
        const type = v.type || 'Không rõ';
        const identifier = v.identifier || '—';
        return `
          <div ><span>${type}: ${identifier}</span></div>
        `;
      }).join('');
    } else {
      vehiclesHTML = '<span style="color: #95a5a6; font-style: italic;">Chưa đăng ký xe nào</span>';
    }

    document.getElementById('userDetailBody').innerHTML = `
      <p><strong>ID:</strong> <span>${user.id}</span></p>
      <p><strong>Full Name:</strong> ${user.fullname || '—'}</p>
      <p><strong>Email:</strong> ${user.email || '—'}</p>
      <p><strong>Phone:</strong> ${user.phone || '—'}</p>
      <p><strong>Birthday:</strong> ${birth}</p>
      <p><strong>Balance:</strong> <strong>${(user.balance || 0).toLocaleString('vi-VN')} VND</strong></p>
      <p><strong>Vehicles:</strong></p>
      ${vehiclesHTML}
    `;

    document.getElementById('userDetailModal').style.display = 'flex';
  })
  .catch(err => {
    console.error(err);
    alert('Lỗi tải thông tin user');
  });
}

function closeUserModal() {
  document.getElementById('userDetailModal').style.display = 'none';
}

// Xóa user
function deleteUser(userId) {
  if (!confirm('Xóa người dùng này? Hành động không thể hoàn tác!')) return;

  fetch(`${API_BASE}/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(() => {
    alert('Đã xóa thành công!');
    reloadCurrentTab();
  })
  .catch(err => alert('Lỗi: ' + err));
}

let allChargers = [];
let currentChargerPage = 1;
const chargersPerPage = 3;

// Tải danh sách trạm sạc
async function loadChargers() {
  try {
    fetch(`${API_BASE}/charger/all`,{
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(data => {
      allChargers = data;
      renderChargerTable();
    });
  } catch (error) {
      alert('Lỗi khi tải danh sách trạm sạc');
  }
}

// Render danh sách trạm sạc
function renderChargerTable() {
    const container = document.getElementById('chargerGridBody');
    const start = (currentChargerPage - 1) * chargersPerPage;
    const end = start + chargersPerPage;
    const data = allChargers.slice(start, end);

    document.getElementById('totalChargers').textContent = allChargers.length;

    container.innerHTML = data.map(charger => {
      const statusText = charger.status;
      const progress = charger.process;

      return `
        <div class="charger-grid-row">
          <div>${charger.id.slice(-8)}</div>
          <div><span>${statusText}</span></div>
          <div><span>${progress}</span></div>
          <div class="action-buttons">
            <button class="action-btn btn-view" onclick="viewCharger('${charger.id}')">Xem</button>
            <button class="action-btn btn-edit" onclick="editCharger('${charger.id}')">Sửa</button>
            <button class="action-btn btn-delete" onclick="deleteCharger('${charger.id}')">Xóa</button>
          </div>
        </div>
      `;
    }).join('');

    renderCommonPagination(allChargers.length, chargersPerPage, currentChargerPage, 'chargerPagination', changeChargerPage);
  }

// THÊM TRẠM SẠC
document.getElementById('btnAddChargers').addEventListener('click', async () => {
  const quantity = parseInt(document.getElementById('chargerQuantity').value);

  if (!quantity || quantity < 1 || quantity > 50) {
    alert('Vui lòng nhập số từ 1 đến 50');
    return;
  }

  const resultDiv = document.getElementById('addResult');
  resultDiv.innerHTML = 'Đang thêm...';

  try {
    const response = await fetch(`${API_BASE}/charger/create?numbers=${quantity}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      resultDiv.innerHTML = `<span style="color:green;">Thêm thành công ${quantity} trạm sạc mới!</span>`;
      reloadCurrentTab();
    } else {
      const errorText = await response.text();
      resultDiv.innerHTML = `<span style="color:red;">Lỗi: ${response.status} - ${errorText}</span>`;
    }
  } catch (err) {
    resultDiv.innerHTML = `<span style="color:red;">Lỗi kết nối: ${err.message}</span>`;
  }
});

  // XEM CHI TIẾT TRẠM SẠC
async function viewCharger(id) {
  try {
    const res = await fetch(`${API_BASE}/charger/${id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const charger = await res.json();
    const statusText = charger.status;

    document.getElementById('chargerDetailBody').innerHTML = `
      <p><strong>ID:</strong> <code>${charger.id}</code></p>
      <p><strong>MngId:</strong> <code>${charger.mngId}</code></p>
      <p><strong>Trạng thái:</strong> <code>${charger.status}</code></p>
      <p><strong>Tiến trình:</strong> <strong>${charger.process}</strong></p>
    `;

    document.getElementById('chargerDetailModal').style.display = 'flex';
  } catch (err) {
    alert('Lỗi tải thông tin trạm');
  }
}

function closeChargerDetail() {
  document.getElementById('chargerDetailModal').style.display = 'none';
}

// SỬA TRẠM SẠC
function editCharger(id) {
  fetch(`${API_BASE}/charger/update/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(res => {
    if (res.ok) {
      alert('Cập nhật thành công!');
      reloadCurrentTab();
    } else {
      alert('Cập nhật thất bại');
    }
  })
  .catch(() => alert('Lỗi kết nối'));
}

// XÓA TRẠM SẠC
function deleteCharger(Id) {
  if (!confirm('Xóa trạm sạc này?')) return;
  fetch(`${API_BASE}/charger/delete/${Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => {
    if (res.ok) {
      alert('Xóa thành công!');
      reloadCurrentTab()
    } else {
      alert('Xóa thất bại');
    }
  })
  .catch(() => alert('Lỗi kết nối'));
}

// Tab Charger
function changeChargerPage(page) {
  const totalPages = Math.ceil(allChargers.length / chargersPerPage);
  if (page < 1 || page > totalPages) return;
  currentChargerPage = page;
  renderChargerTable();
}

let allManagers = [];
let filteredManagers = [];
let currentManagerPage = 1;
const managersPerPage = 2;

// tảidanh sách manager
async function loadManagers() {
  try {
    const res = await fetch(`${API_BASE}/all`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const users = await res.json();
    allManagers = users.filter(u => u.role === 2);
    filteredManagers = [...allManagers];
    document.getElementById('totalManagers').textContent = filteredManagers.length;
    renderManagerTable();
  } catch (err) {
    alert('Lỗi tải danh sách manager');
  }
}

// Render danh sách  manager
function renderManagerTable() {
  const container = document.getElementById('managerGridBody');
  const start = (currentManagerPage - 1) * managersPerPage;
  const end = start + managersPerPage;
  const pageData = filteredManagers.slice(start, end);

  if (pageData.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#999;">Không tìm thấy manager nào</div>';
    document.getElementById('managerPagination').innerHTML = '';
    return;
  }

  container.innerHTML = pageData.map(m => `
    <div class="manager-grid-row">
      <div>${m.id.slice(-8)}</div>
      <div>${m.phone || '—'}</div>
      <div>${m.fullname || '—'}</div>
      <div>${m.address || '—'}</div>
      <div class="action-buttons">
        <button class="action-btn btn-view" onclick="viewManager('${m.id}')">Xem</button>
        <button class="action-btn btn-add" onclick="openAddChargerModal('${m.id}', '${m.fullname || m.phone}')">Thêm</button>
        <button class="action-btn btn-delete" onclick="deleteManager('${m.id}')">Xóa</button>
      </div>
    </div>
  `).join('');

  renderCommonPagination(filteredManagers.length, managersPerPage, currentManagerPage, 'managerPagination', changeManagerPage);
}

function changeManagerPage(page) {
  const totalPages = Math.ceil(filteredManagers.length / managersPerPage);
  if (page < 1 || page > totalPages) return;
  currentManagerPage = page;
  renderManagerTable();
}

// Tìm kiếm 
document.getElementById('searchManager')?.addEventListener('input', function() {
  const query = this.value.toLowerCase();
  filteredManagers = allManagers.filter(m =>
    m.fullname?.toLowerCase().includes(query) ||
    m.phone?.includes(query)
  );
  currentManagerPage = 1;
  renderManagerTable();
});

// XEM CHI TIẾT MANAGER
async function viewManager(id) {
  try {
    const res = await fetch(`${API_BASE}/profile/${id}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const user = await res.json();
    const stationIds = user.stations || [];

    let stationsHTML = '';
    if (stationIds.length === 0) {
      stationsHTML = '<p><em>Chưa có trạm sạc nào</em></p>';
    } else {
      stationsHTML = `
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 12px; border: 1px solid #e0e0e0;max-height: 100px; overflow-y: auto;">
          <strong style="color: #2c3e50; font-size: 16px;">Trạm sạc đang quản lý (${stationIds.length}):</strong>
            ${stationIds.map(stationId => `<span>${stationId}</span>`).join('')}
        </div>
      `;
    }

    document.getElementById('managerDetailBody').innerHTML = `
      <p><strong>ID:</strong> <code>${user.id}</code></p>
      <p><strong>Họ tên:</strong> ${user.fullname || '—'}</p>
      <p><strong>Email:</strong> ${user.email || '—'}</p>
      <p><strong>SĐT:</strong> ${user.phone || '—'}</p>
      <p><strong>Địa chỉ:</strong> ${user.address || '—'}</p>      
      ${stationsHTML}
    `;

    document.getElementById('managerDetailModal').style.display = 'flex';
  } catch (err) {
    console.error(err);
    alert('Lỗi tải thông tin manager');
  }
}

function closeManagerDetail() {
  document.getElementById('managerDetailModal').style.display = 'none';
}

// Modal thêm trạm sạc
function openAddChargerModal(userId, name) {
  document.getElementById('addChargerUserId').value = userId;
  document.getElementById('addChargerModalTitle').textContent = `Thêm trạm cho: ${name}`;
  document.getElementById('chargerQuantityInput').value = 1;
  document.getElementById('addChargerToManagerModal').style.display = 'flex';
}

function closeAddChargerModal() {
  document.getElementById('addChargerToManagerModal').style.display = 'none';
}

// Thêm trạm sạc
document.getElementById('addChargerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const userId = document.getElementById('addChargerUserId').value;
  const number = parseInt(document.getElementById('chargerQuantityInput').value);

  if (number < 1 || number > 50) return alert('Số lượng từ 1 đến 50');

  try {
    const res = await fetch(`${API_BASE}/charger/manager/${userId}?number=${number}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
      alert(`Thêm thành công ${number} trạm!`);
      closeAddChargerModal();
      reloadCurrentTab();
    } else {
      const err = await res.text();
      alert('Lỗi: ' + err);
    }
  } catch (err) {
    alert('Lỗi kết nối');
  }
});

// Xóa manager
async function deleteManager(id) {
  if (!confirm('Xóa manager này?')) return;
  try {
    const res = await fetch(`${API_BASE}/delete/manager/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      alert('Xóa manager thành công!');
      reloadCurrentTab();
    } else {
      alert('Xóa thất bại');
    }
  } catch (err) {
    alert('Lỗi kết nối');
  }
}

/* ------------------ TAB PROMOTION ---------------- */

let allPromotions = [];
let filteredPromotions = [];
let currentPromotionPage = 1;
const promotionsPerPage = 2;

function normalizeStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Load danh sách promotion
async function loadPromotions() {
  try {
    const token = localStorage.getItem('jwtToken');
    const res = await fetch(`${API_BASE}/promote/managers`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allPromotions = Array.isArray(data) ? data : [];
    filteredPromotions = [...allPromotions];

    document.getElementById('totalPromotions').textContent = filteredPromotions.length;
    renderPromotionTable();

  } catch (err) {
    console.error(err);
    alert('Lỗi tải danh sách yêu cầu: ' + err.message);
  }
}

// Render danh sách đăng ký
async function renderPromotionTable() {
  const container = document.getElementById('promotionGridBody');
  const start = (currentPromotionPage - 1) * promotionsPerPage;
  const end = start + promotionsPerPage;
  const pageData = filteredPromotions.slice(start, end);

  if (pageData.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:80px;color:#999;font-size:16px;">Không có yêu cầu nào</div>';
    document.getElementById('promotionPagination').innerHTML = '';
    return;
  }

  const userPromises = pageData.map(async (p) => {
    try {
      const r = await fetch(`${API_BASE}/profile/${p.userId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (r.ok) return await r.json();
      return { fullname: 'User đã xóa' };
    } catch {
      return { fullname: 'Lỗi tải' };
    }
  });

  const users = await Promise.all(userPromises);

  container.innerHTML = pageData.map((prom, i) => {
    const user = users[i];
    return `
      <div class="promotion-grid-row">
        <div><code>${prom.id.slice(-8)}</code></div>
        <div><code>${prom.status}</code></div>
        <div><code>${prom.userId.slice(-8)}</code></div>
        <div><code>${user.fullname || '—'}</code></div>
        <div class="action-buttons">
          <button class="action-btn btn-view" onclick="viewPromotion('${prom.id}', '${prom.userId}')">Xem</button>
          ${prom.status === 'Pending' 
            ? `<button class="action-btn btn-save" onclick="approvePromotion('${prom.id}')">Duyệt</button>`
            : `<span style="color:#95a5a6;font-size:12px;">Đã xử lý</span>`
          }
        </div>
      </div>
    `;
  }).join('');

  renderCommonPagination(filteredPromotions.length, promotionsPerPage, currentPromotionPage, 'promotionPagination', promotionChargerPage);
}

// Xem chi tiết
async function viewPromotion(promId, userId) {
  try {
    const [promRes, userRes] = await Promise.all([
      fetch(`${API_BASE}/promote/${promId}`, { headers: { Authorization: 'Bearer ' + token } }),
      fetch(`${API_BASE}/profile/${userId}`, { headers: { Authorization: 'Bearer ' + token } })
    ]);

    const prom = await promRes.json();
    const user = await userRes.json();

    document.getElementById('promotionDetailBody').innerHTML = `
      <p><strong>ID yêu cầu:</strong> <code>${prom.id}</code></p>
      <p><strong>Trạng thái:</strong> <code>${prom.status}</code></p>
      <p><strong>Ngày gửi:</strong> ${prom.startDate ? new Date(prom.startDate).toLocaleDateString('vi-VN') : '—'}</p>
      <p><strong>Ngày duyệt:</strong> ${prom.approvedDate ? new Date(prom.approvedDate).toLocaleDateString('vi-VN') : '—'}</p>
      <hr>
      <h4>Thông tin người yêu cầu</h4>
      <p><strong>Họ tên:</strong> ${user.fullname || '—'}</p>
      <p><strong>Email:</strong> ${user.email || '—'}</p>
      <p><strong>SĐT:</strong> ${user.phone || '—'}</p>
      <p><strong>Địa chỉ:</strong> ${user.address || '—'}</p>
    `;

    document.getElementById('promotionDetailModal').style.display = 'flex';
  } catch (err) {
    alert('Lỗi tải chi tiết');
  }
}

function closePromotionDetail() {
  document.getElementById('promotionDetailModal').style.display = 'none';
}

// Duyệt yêu cầu
async function approvePromotion(promId) {
  if (!confirm('Duyệt yêu cầu này? User sẽ trở thành Manager!')) return;

  try {
    const res = await fetch(`${API_BASE}/promote/update/${promId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ status: 'Approved' }) 
    });

    if (res.ok) {
      alert('Duyệt thành công!');
      reloadCurrentTab();
    } else {
      alert('Duyệt thất bại');
    }
  } catch (err) {
    alert('Lỗi kết nối');
  }
}

// Lọc
document.getElementById('filterStatus')?.addEventListener('change', function() {
  const val = this.value;
  filteredPromotions = val ? allPromotions.filter(p => normalizeStatus(p.status) === val) : [...allPromotions];
  currentPromotionPage = 1;
  renderPromotionTable();
});

// Chuyển trang
function promotionChargerPage(page) {
  const totalPages = Math.ceil(filteredPromotions.length / promotionsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPromotionPage = page;
  renderPromotionTable();
}

// ---------- PHÂN TRANG CHUNG -----------------
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

// ----------- RELOAD TAB HIỆN TẠI ------------
function reloadCurrentTab() {
  if (document.querySelector('.user-page').style.display === 'flex') {
    loadUsers?.();
  }
  else if (document.querySelector('.charger-page').style.display === 'flex') {
    loadChargers();
  }
  else if (document.querySelector('.main-content').style.display === 'flex') {
    location.reload();
  }
  else if (document.querySelector('.promotion-page').style.display === 'flex') {
    loadPromotions?.();
  }
  else if (document.querySelector('.manager-page').style.display === 'flex') {
    loadManagers?.();
  }
}