const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'users.json');

// --- "Database" sederhana berbasis file JSON ---
function loadUsers() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ganti-dengan-secret-key-anda-sendiri', // TODO: pindahkan ke environment variable saat produksi
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 hari
  }
}));

// --- Validasi input sederhana ---
function validateCredentials(username, password) {
  if (!username || !password) return 'Username dan password wajib diisi.';
  if (username.length < 3) return 'Username minimal 3 karakter.';
  if (password.length < 6) return 'Password minimal 6 karakter.';
  return null;
}

// --- Daftar akun baru ---
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const error = validateCredentials(username, password);
  if (error) return res.status(400).json({ error });

  const users = loadUsers();
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Username sudah terdaftar.' });

  const hash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash: hash, createdAt: new Date().toISOString() });
  saveUsers(users);

  res.status(201).json({ message: 'Akun berhasil dibuat. Silakan masuk.' });
});

// --- Masuk / login ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const users = loadUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Username atau password salah.' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Username atau password salah.' });

  req.session.user = { username: user.username };
  res.json({ message: 'Berhasil masuk.', username: user.username });
});

// --- Keluar / logout ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Berhasil keluar.' });
  });
});

// --- Cek status sesi saat ini ---
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// --- Contoh halaman yang butuh login ---
app.get('/api/dashboard', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Belum masuk.' });
  res.json({ message: `Selamat datang kembali, ${req.session.user.username}!` });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
