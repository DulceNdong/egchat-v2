const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'egchat_secret_2026';

app.use(cors());
app.use(express.json());

// ── Base de datos en memoria (reemplazar con DB real) ─────────────
const users = new Map();
const wallets = new Map();
const transactions = new Map();
const messages = new Map();

// ── Middleware auth ───────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// ── ROOT ──────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ name: 'EGCHAT API', version: '1.0.0', status: 'active' }));

// ══════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password, full_name } = req.body;
    if (!phone || !password || !full_name)
      return res.status(400).json({ message: 'phone, password y full_name son requeridos' });
    if (users.has(phone))
      return res.status(409).json({ message: 'El teléfono ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), phone, full_name, password: hashed, created_at: new Date().toISOString() };
    users.set(phone, user);
    wallets.set(user.id, { balance: 5000, currency: 'XAF' });
    transactions.set(user.id, []);
    const token = jwt.sign({ id: user.id, phone }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user.id, phone, full_name } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ message: 'phone y password son requeridos' });
    const user = users.get(phone);
    if (!user) return res.status(401).json({ message: 'Credenciales incorrectas' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Credenciales incorrectas' });
    const token = jwt.sign({ id: user.id, phone }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, phone, full_name: user.full_name } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ id: user.id, phone: user.phone, full_name: user.full_name });
});

app.post('/api/auth/logout', auth, (req, res) => res.json({ message: 'Sesión cerrada' }));

// ══════════════════════════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════════════════════════
app.get('/api/wallet/balance', auth, (req, res) => {
  const w = wallets.get(req.user.id) || { balance: 0 };
  res.json({ balance: w.balance, currency: 'XAF' });
});

app.get('/api/wallet/transactions', auth, (req, res) => {
  const txs = transactions.get(req.user.id) || [];
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const start = (page - 1) * limit;
  res.json({ transactions: txs.slice(start, start + limit), total: txs.length });
});

app.post('/api/wallet/deposit', auth, (req, res) => {
  const { amount, method, reference } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Importe inválido' });
  const w = wallets.get(req.user.id) || { balance: 0 };
  w.balance += amount;
  wallets.set(req.user.id, w);
  const tx = { id: `tx_${Date.now()}`, type: 'deposit', amount, method, reference, date: new Date().toISOString(), status: 'completed' };
  const txs = transactions.get(req.user.id) || [];
  txs.unshift(tx);
  transactions.set(req.user.id, txs);
  res.json({ balance: w.balance, transaction: tx });
});

app.post('/api/wallet/withdraw', auth, (req, res) => {
  const { amount, method, destination } = req.body;
  const w = wallets.get(req.user.id) || { balance: 0 };
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Importe inválido' });
  if (amount > w.balance) return res.status(400).json({ message: 'Saldo insuficiente' });
  w.balance -= amount;
  wallets.set(req.user.id, w);
  const tx = { id: `tx_${Date.now()}`, type: 'withdraw', amount, method, reference: destination, date: new Date().toISOString(), status: 'completed' };
  const txs = transactions.get(req.user.id) || [];
  txs.unshift(tx);
  transactions.set(req.user.id, txs);
  res.json({ balance: w.balance, transaction: tx });
});

app.post('/api/wallet/transfer', auth, (req, res) => {
  const { to, amount, concept } = req.body;
  const w = wallets.get(req.user.id) || { balance: 0 };
  if (amount > w.balance) return res.status(400).json({ message: 'Saldo insuficiente' });
  w.balance -= amount;
  wallets.set(req.user.id, w);
  const tx = { id: `tx_${Date.now()}`, type: 'transfer_sent', amount, method: 'EGCHAT', reference: `A: ${to} · ${concept||''}`, date: new Date().toISOString(), status: 'completed' };
  const txs = transactions.get(req.user.id) || [];
  txs.unshift(tx);
  transactions.set(req.user.id, txs);
  res.json({ balance: w.balance, transaction: tx });
});

app.post('/api/wallet/recharge-code', auth, (req, res) => {
  const { code } = req.body;
  if (!code || code.replace(/-/g,'').length !== 16)
    return res.status(400).json({ message: 'Código inválido' });
  // Simulación: todos los códigos válidos dan 5000 XAF
  const amount = 5000;
  const w = wallets.get(req.user.id) || { balance: 0 };
  w.balance += amount;
  wallets.set(req.user.id, w);
  const tx = { id: `tx_${Date.now()}`, type: 'deposit', amount, method: 'Código de recarga', reference: code, date: new Date().toISOString(), status: 'completed' };
  const txs = transactions.get(req.user.id) || [];
  txs.unshift(tx);
  transactions.set(req.user.id, txs);
  res.json({ balance: w.balance, amount, message: `${amount.toLocaleString()} XAF añadidos` });
});

// ══════════════════════════════════════════════════════════════════
// LIA-25 (IA)
// ══════════════════════════════════════════════════════════════════
app.post('/api/lia/chat', auth, (req, res) => {
  const { message, history } = req.body;
  const lower = message.toLowerCase();
  const w = wallets.get(req.user.id) || { balance: 0 };
  let reply = '';

  if (lower.includes('saldo') || lower.includes('balance'))
    reply = `Tu saldo actual es **${w.balance.toLocaleString()} XAF**. ¿Deseas recargar o retirar?`;
  else if (lower.includes('hola') || lower.includes('buenos'))
    reply = '¡Hola! Soy Lia-25, tu asistente inteligente de EGCHAT. ¿En qué puedo ayudarte hoy?';
  else if (lower.includes('taxi'))
    reply = 'Puedo ayudarte a pedir un taxi. Ve a la sección MiTaxi desde el menú principal.';
  else if (lower.includes('salud') || lower.includes('hospital') || lower.includes('farmacia'))
    reply = 'En la sección Salud encontrarás hospitales, farmacias y puedes pedir citas médicas.';
  else if (lower.includes('supermercado') || lower.includes('compra'))
    reply = 'Puedes hacer compras en línea desde la sección Supermercados. Tenemos tiendas en Malabo y Bata.';
  else if (lower.includes('transferir') || lower.includes('enviar dinero'))
    reply = 'Para enviar dinero, ve a Mi Monedero → Enviar, o dime el número de teléfono del destinatario y el importe.';
  else if (lower.includes('gracias'))
    reply = '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?';
  else
    reply = `Entendido: "${message}". Puedo ayudarte con tu saldo, transferencias, taxi, salud, supermercados y más. ¿Qué necesitas?`;

  res.json({ reply, timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════════════════════════
app.get('/api/user/profile', auth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'No encontrado' });
  res.json({ id: user.id, phone: user.phone, full_name: user.full_name });
});

app.put('/api/user/profile', auth, (req, res) => {
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'No encontrado' });
  Object.assign(user, req.body);
  users.set(user.phone, user);
  res.json({ id: user.id, phone: user.phone, full_name: user.full_name });
});

app.post('/api/user/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = [...users.values()].find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'No encontrado' });
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
  user.password = await bcrypt.hash(newPassword, 10);
  users.set(user.phone, user);
  res.json({ message: 'Contraseña actualizada' });
});

// ══════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 EGCHAT API corriendo en http://localhost:${PORT}`);
  console.log(`   Auth:   POST /api/auth/register | /api/auth/login`);
  console.log(`   Wallet: GET  /api/wallet/balance | POST /api/wallet/deposit`);
  console.log(`   Lia-25: POST /api/lia/chat`);
  console.log(`   User:   GET  /api/user/profile\n`);
});
