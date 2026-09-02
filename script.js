const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const confirmField = document.getElementById('confirmField');
const authForm = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const messageEl = document.getElementById('message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');

const card = document.querySelector('.card');
const sealBig = document.querySelector('.seal:not(.small)');
const dashboard = document.getElementById('dashboard');
const dashUsername = document.getElementById('dashUsername');
const logoutBtn = document.getElementById('logoutBtn');

let mode = 'login'; // 'login' | 'register'

function setMode(newMode) {
  mode = newMode;
  const isLogin = mode === 'login';

  tabLogin.classList.toggle('is-active', isLogin);
  tabRegister.classList.toggle('is-active', !isLogin);
  tabLogin.setAttribute('aria-selected', String(isLogin));
  tabRegister.setAttribute('aria-selected', String(!isLogin));

  confirmField.hidden = isLogin;
  confirmInput.required = !isLogin;
  passwordInput.autocomplete = isLogin ? 'current-password' : 'new-password';

  formTitle.textContent = isLogin ? 'Selamat datang kembali' : 'Buat akun baru';
  formSubtitle.textContent = isLogin
    ? 'Masuk untuk melanjutkan ke akun Anda.'
    : 'Isi data di bawah untuk mendaftar.';
  submitBtn.textContent = isLogin ? 'Masuk' : 'Daftar';

  clearMessage();
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type === 'success' ? ' success' : '');
}

function clearMessage() {
  messageEl.textContent = '';
  messageEl.className = 'message';
}

tabLogin.addEventListener('click', () => setMode('login'));
tabRegister.addEventListener('click', () => setMode('register'));

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (mode === 'register' && password !== confirmInput.value) {
    showMessage('Password dan konfirmasi tidak sama.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = mode === 'login' ? 'Memproses…' : 'Mendaftarkan…';

  try {
    const endpoint = mode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'Terjadi kesalahan.');
      return;
    }

    if (mode === 'register') {
      showMessage('Akun berhasil dibuat. Silakan masuk.', 'success');
      setMode('login');
      usernameInput.value = username;
      passwordInput.value = '';
    } else {
      enterDashboard(data.username);
    }
  } catch (err) {
    showMessage('Tidak dapat terhubung ke server.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'login' ? 'Masuk' : 'Daftar';
  }
});

function enterDashboard(username) {
  card.hidden = true;
  sealBig.hidden = true;
  document.querySelector('.switcher').hidden = true;
  dashboard.hidden = false;
  dashUsername.textContent = username;
}

function exitDashboard() {
  card.hidden = false;
  sealBig.hidden = false;
  dashboard.hidden = true;
  authForm.reset();
  setMode('login');
}

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  exitDashboard();
});

// Cek apakah sudah ada sesi aktif saat halaman dibuka
(async function checkSession() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    if (data.loggedIn) enterDashboard(data.username);
  } catch (err) {
    // biarkan pengguna melihat form login jika gagal cek sesi
  }
})();
