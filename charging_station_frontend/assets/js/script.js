'use strict';

/**
 * #PRELOADING
 */
const loadElement = document.querySelector("[data-preloader]");
window.addEventListener("load", () => loadElement.classList.add("loaded"));

/**
 * #MOBILE NAVBAR TOGGLE
 */
const navbar = document.querySelector("[data-navbar]");
const navToggler = document.querySelector("[data-nav-toggler]");
const toggleNavbar = () => {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
};
navToggler.addEventListener("click", toggleNavbar);

/**
 * #HEADER
 */
const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-go-top-btn]");
window.addEventListener("scroll", () => {
  if (window.scrollY >= 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
});

/**
 * #SCROLL REVEAL
 */
const revealElements = document.querySelectorAll("[data-reveal]");
const scrollReveal = () => {
  revealElements.forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight / 1.2) {
      el.classList.add("revealed");
    } else {
      el.classList.remove("revealed");
    }
  });
};
window.addEventListener("scroll", scrollReveal);
window.addEventListener("load", scrollReveal);

/**
 * Smooth scroll
 */
document.querySelectorAll('.navbar-link').forEach(link => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    if (targetId.startsWith('#')) {
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (navbar.classList.contains('active')) toggleNavbar();
    }
  });
});

/**
 * #USER DROPDOWN + HOVER
 */
function setupDropdownHover(loginBtn) {
  const dropdown = loginBtn.querySelector('.user-dropdown');
  if (!dropdown) return;

  loginBtn.addEventListener('mouseenter', () => loginBtn.classList.add('user-hover'));
  loginBtn.addEventListener('mouseleave', () => loginBtn.classList.remove('user-hover'));
  dropdown.addEventListener('mouseenter', () => loginBtn.classList.add('user-hover'));
  dropdown.addEventListener('mouseleave', () => loginBtn.classList.remove('user-hover'));
}

function showUserDropdown(loginHeaderBtn, fullname, role) {
  if (!loginHeaderBtn) return;

  // Xóa tất cả event listener cũ
  const newLoginHeaderBtn = loginHeaderBtn.cloneNode(true);
  loginHeaderBtn.parentNode.replaceChild(newLoginHeaderBtn, loginHeaderBtn);
  loginHeaderBtn = newLoginHeaderBtn;

  // Thay nội dung nút
  loginHeaderBtn.innerHTML = `
    <span class="span">${fullname}</span>
    <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
  `;

  // Tạo dropdown theo role
  const dropdown = document.createElement('ul');
  dropdown.classList.add('user-dropdown');

  // Logic hiển thị theo yêu cầu
  let options = [];

  if (role === 0) {
    options = ['User'];
  } 
  else if (role === 1) {
    options = ['Admin', 'User'];
  } 
  else if (role === 2) {
    options = ['Manager', 'User'];
  }

  // Tạo item trong dropdown
  options.forEach(option => {
    const li = document.createElement('li');
    li.textContent = option;
    li.classList.add('dropdown-item');
    
    // Thêm sự kiện click
    li.addEventListener('click', () => {
      if (option === 'User') {
        window.location.href = 'user.html'; 
      } else if (option === 'Admin') {
        window.location.href = 'admin.html'; 
      } else if (option === 'Manager') {
        window.location.href = 'manager.html'; 
      }
    });

    dropdown.appendChild(li);
  });

  // Thêm Logout
  const logoutLi = document.createElement('li');
  logoutLi.textContent = 'Logout';
  logoutLi.classList.add('dropdown-item');
  logoutLi.addEventListener('click', () => logout());
  dropdown.appendChild(logoutLi);

  loginHeaderBtn.appendChild(dropdown);

  // Click để mở dropdown
  loginHeaderBtn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  // Click ra ngoài đóng dropdown
  document.addEventListener('click', () => dropdown.classList.remove('active'));

  setupDropdownHover(loginHeaderBtn);
}


/**
 * #MODAL & LOGIN/ SIGNUP LOGIC
 */
document.addEventListener('DOMContentLoaded', () => {
  const loginHeaderBtn = document.getElementById('loginBtn');
  const authModal = document.getElementById('authModal');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const closeModalBtns = document.querySelectorAll('[data-modal-close]');

  // Nếu đã login trước đó
  const savedName = localStorage.getItem('userFullName');
  const savedRole = parseInt(localStorage.getItem('userRole'));
  if (savedName && loginHeaderBtn) {
    showUserDropdown(loginHeaderBtn, savedName, savedRole);
  } else if (loginHeaderBtn) {
    loginHeaderBtn.addEventListener('click', e => {
      e.preventDefault();
      authModal.classList.add('active');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    });
  }

  // Đóng modal
  closeModalBtns.forEach(btn => btn.addEventListener('click', () => authModal.classList.remove('active')));

  // Chuyển login <-> signup
  if (showSignupLink) {
    showSignupLink.addEventListener('click', e => {
      e.preventDefault();
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    });
  }
  if (showLoginLink) {
    showLoginLink.addEventListener('click', e => {
      e.preventDefault();
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }
});

/**
 * #SIGNUP USER
 */
const signupUserForm = document.getElementById('signupUserForm');
if (signupUserForm) {
  signupUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
      fullname: document.getElementById('fullname').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      phone: document.getElementById('phone').value.trim(),
      birthday: document.getElementById('birthday').value
    };

    try {
      const response = await fetch('http://localhost:8080/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        alert('Đăng ký thành công!');
        signupUserForm.reset();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
      } else {
        alert('Lỗi: ' + (result.message || 'Đăng ký thất bại!'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Không thể kết nối tới server.');
    }
  });
}

/**
 * #LOGIN USER
 */
const loginUserForm = document.getElementById('loginUserForm');
if (loginUserForm) {
  loginUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginHeaderBtn = document.getElementById('loginBtn');
    const authModal = document.getElementById('authModal');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        mode: 'cors'
      });

      console.log('Login response status:', response.status);
      const result = await response.json();

      if (response.ok && result.token) {
        const token = result.token;
        console.log(token);
        localStorage.setItem('jwtToken', token);

        // lấy user fullname
        const profileResp = await fetch('http://localhost:8080/profile', {
          method: 'GET',
          headers: { 'Authorization': 'Bearer ' + token },
          mode: 'cors'
        });

        const user = await profileResp.json();
        const fullName = user.fullname || 'User';
        const role = user.role;
        localStorage.setItem('userFullName', fullName);
        localStorage.setItem('userRole', role);

        showUserDropdown(loginHeaderBtn, fullName, role);
        authModal.classList.remove('active');
        loginUserForm.reset();
      } else {
        alert(result.message || 'Email hoặc mật khẩu không đúng.');
      }

    } catch (err) {
      console.error('Login error:', err);
      alert('Không thể kết nối tới server.');
    }
  });
}

/**
 * #LOGOUT
 */
async function logout() {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  try {
    await fetch('http://localhost:8080/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
  } catch (err) {
    console.error('Logout error:', err);
  }

  localStorage.removeItem('jwtToken');
  localStorage.removeItem('userFullName');
  localStorage.removeItem('userRole');

  // Reload trang để reset UI
  window.location.reload();
}
//localStorage.clear();