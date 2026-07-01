// dotenv solo en local (en Render las vars vienen del dashboard)
try { require('dotenv').config(); } catch(e) {}
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'egchat_secret_2026';

// ── Supabase ──────────────────────────────────────────────────────
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );
} catch (e) {
  console.error('Error creating Supabase client:', e);
  supabase = null;
}

app.use(cors({ origin: '*' }));
app.use(express.json());

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
app.get('/', (req, res) => res.json({
  message: 'EGCHAT API funcionando!',
  version: '2.5.0',
  database: 'Supabase',
  status: 'active'
}));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/stats/users', async (req, res) => {
  try {
    const { count, error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) return res.status(500).json({ message: error.message });
    res.json({ totalUsers: count || 0 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/debug', (req, res) => res.json({
  supabase_url: process.env.SUPABASE_URL ? '✅ set' : '❌ missing',
  supabase_key: process.env.SUPABASE_SERVICE_KEY ? '✅ set' : '❌ missing',
  jwt_secret: process.env.JWT_SECRET ? '✅ set' : '❌ missing',
  node_env: process.env.NODE_ENV || 'not set',
  port: PORT
}));

// ── AUTH ──────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, phone, password } = req.body;
    if (!full_name || !phone || !password) return res.status(400).json({ message: 'Todos los campos son requeridos' });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert({
      full_name,
      phone,
      password_hash: hashed,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) return res.status(400).json({ message: error.message });
    const token = jwt.sign({ id: data.id, phone: data.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: data.id, full_name: data.full_name, phone: data.phone, avatar_url: data.avatar_url } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Teléfono y contraseña requeridos' });

    const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, full_name: user.full_name, phone: user.phone, avatar_url: user.avatar_url } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const { data } = await supabase.from('users').select('id,full_name,phone,avatar_url').eq('id', req.user.id).single();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── CONTACTS ──────────────────────────────────────────────────────
app.get('/api/contacts', auth, async (req, res) => {
  try {
    const { data } = await supabase.from('contacts').select('*').eq('user_id', req.user.id);
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/contacts', auth, async (req, res) => {
  try {
    const { contact_user_id, phone, name } = req.body;
    let targetId = contact_user_id;

    if (!targetId && phone) {
      const { data: found } = await supabase.from('users').select('id').eq('phone', phone).single();
      if (!found) return res.status(404).json({ message: 'Usuario no encontrado' });
      targetId = found.id;
    }

    if (!targetId) return res.status(400).json({ message: 'contact_user_id o phone requerido' });
    if (targetId === req.user.id) return res.status(400).json({ message: 'No puedes agregarte a ti mismo' });

    const { data, error } = await supabase.from('contacts').insert({
      user_id: req.user.id,
      contact_user_id: targetId,
      name: name || null
    }).select().single();

    if (error) return res.status(400).json({ message: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/contacts/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { data } = await supabase.from('users').select('id,full_name,phone,avatar_url').ilike('full_name', `%${q}%`).neq('id', req.user.id).limit(10);
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── CHATS ─────────────────────────────────────────────────────────
app.get('/api/chats', auth, async (req, res) => {
  try {
    const { data: myChats } = await supabase.from('chat_participants').select('chat_id').eq('user_id', req.user.id);
    if (!myChats || myChats.length === 0) return res.json([]);

    const chatIds = myChats.map(c => c.chat_id);
    const { data: chats } = await supabase.from('chats').select('*').in('id', chatIds);

    const enriched = await Promise.all(chats.map(async (chat) => {
      const { data: participants } = await supabase.from('chat_participants').select('user_id, users(id,full_name,phone,avatar_url)').eq('chat_id', chat.id);
      const { data: lastMsg } = await supabase.from('messages').select('*').eq('chat_id', chat.id).order('created_at', { ascending: false }).limit(1).single();

      const other = participants.find(p => p.user_id !== req.user.id);
      return {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        participants: participants.map(p => ({ user_id: p.user_id, ...p.users })),
        last_message: lastMsg || null,
        created_at: chat.created_at
      };
    }));

    res.json(enriched);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Crear chat privado
// Crear chat privado — usa chat_participants
app.post('/api/chats/private', auth, async (req, res) => {
  try {
    const { participant_id, phone } = req.body;
    let targetId = participant_id;

    // Si viene phone en vez de ID, buscar el usuario
    if (!targetId && phone) {
      const { data: found } = await supabase.from('users').select('id,full_name,phone,avatar_url').eq('phone', phone).single();
      if (!found) return res.status(404).json({ message: 'Usuario no encontrado con ese numero' });
      targetId = found.id;
    }

    if (!targetId) return res.status(400).json({ message: 'participant_id o phone requerido' });
    if (targetId === req.user.id) return res.status(400).json({ message: 'No puedes chatear contigo mismo' });

    // Buscar chat existente entre los dos
    const { data: myChats } = await supabase.from('chat_participants').select('chat_id').eq('user_id', req.user.id);
    const { data: theirChats } = await supabase.from('chat_participants').select('chat_id').eq('user_id', targetId);
    const myIds = (myChats||[]).map(c => c.chat_id);
    const theirIds = (theirChats||[]).map(c => c.chat_id);
    const common = myIds.filter(id => theirIds.includes(id));

    if (common.length > 0) {
      const { data: existing } = await supabase.from('chats').select('*').eq('id', common[0]).single();
      return res.json(existing);
    }

    // Crear nuevo chat
    const { data: newChat, error: chatError } = await supabase.from('chats').insert({
      type: 'individual',
      name: null,
      created_at: new Date().toISOString()
    }).select().single();

    if (chatError) return res.status(500).json({ message: chatError.message });

    // Agregar participantes
    await supabase.from('chat_participants').insert([
      { chat_id: newChat.id, user_id: req.user.id },
      { chat_id: newChat.id, user_id: targetId }
    ]);

    res.status(201).json(newChat);
  } catch (e) {
    console.error('Create private chat error:', e);
    res.status(500).json({ message: e.message });
  }
});

// Crear chat grupal
app.post('/api/chats/group', auth, async (req, res) => {
  try {
    const { name, participant_ids, avatar_url } = req.body;

    if (!name || !participant_ids || participant_ids.length === 0) {
      return res.status(400).json({ message: 'El nombre y los participantes son requeridos' });
    }

    if (!participant_ids.includes(req.user.id)) {
      participant_ids.push(req.user.id);
    }

    const { data: newChat, error: chatError } = await supabase.from('chats').insert({
      type: 'group',
      name,
      avatar_url,
      created_at: new Date().toISOString()
    }).select().single();

    if (chatError) return res.status(500).json({ message: chatError.message });

    const participants = participant_ids.map(id => ({ chat_id: newChat.id, user_id: id }));
    await supabase.from('chat_participants').insert(participants);

    res.status(201).json(newChat);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── MESSAGES ──────────────────────────────────────────────────────
app.get('/api/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar acceso al chat
    const { data: participant } = await supabase.from('chat_participants').select('user_id').eq('chat_id', chatId).eq('user_id', req.user.id).single();
    if (!participant) return res.status(403).json({ message: 'No tienes acceso a este chat' });

    const { data: messages } = await supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    res.json(messages.reverse());
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, type = 'text' } = req.body;

    // Verificar acceso
    const { data: participant } = await supabase.from('chat_participants').select('user_id').eq('chat_id', chatId).eq('user_id', req.user.id).single();
    if (!participant) return res.status(403).json({ message: 'No tienes acceso a este chat' });

    const { data: message, error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: req.user.id,
      text,
      type,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json(message);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── WALLET ────────────────────────────────────────────────────────
app.get('/api/wallet', auth, async (req, res) => {
  try {
    const { data } = await supabase.from('wallets').select('*').eq('user_id', req.user.id).single();
    res.json(data || { balance: 0, currency: 'XAF' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/wallet/recharge', auth, async (req, res) => {
  try {
    const { amount, code } = req.body;

    const { data: recharge } = await supabase.from('recharge_codes').select('*').eq('code', code).eq('used', false).single();
    if (!recharge) return res.status(400).json({ message: 'Código inválido o ya usado' });

    await supabase.from('recharge_codes').update({ used: true, used_by: req.user.id, used_at: new Date().toISOString() }).eq('id', recharge.id);

    const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', req.user.id).single();
    const newBalance = (wallet?.balance || 0) + amount;

    await supabase.from('wallets').upsert({
      user_id: req.user.id,
      balance: newBalance,
      currency: 'XAF',
      updated_at: new Date().toISOString()
    });

    await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: 'recharge',
      amount,
      description: `Recarga con código ${code}`,
      created_at: new Date().toISOString()
    });

    res.json({ balance: newBalance });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get('/api/wallet/transactions', auth, async (req, res) => {
  try {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    res.json(data || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── LIA ───────────────────────────────────────────────────────────
app.post('/api/lia/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    // Simular respuesta de LIA
    const responses = [
      '¡Hola! Soy LIA, tu asistente virtual. ¿En qué puedo ayudarte?',
      'Entiendo tu consulta. Déjame procesar eso...',
      '¡Genial! ¿Quieres saber más sobre EGCHAT?',
      'Estoy aquí para ayudarte con cualquier duda sobre la plataforma.'
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    res.json({ response: randomResponse });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ── START SERVER ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 EGCHAT API corriendo en puerto ${PORT}`);
  console.log(`📊 Supabase: ${process.env.SUPABASE_URL ? 'Conectado' : 'No configurado'}`);
});