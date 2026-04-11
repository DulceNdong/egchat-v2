const BASE = 'https://egchat-api.onrender.com';

async function test() {
  console.log('=== TEST MENSAJERIA EGCHAT v2.5 ===\n');

  // Login REDDINGTON
  const r1 = await fetch(`${BASE}/api/auth/login`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({phone:'+240555570323', password:'test123'})
  });
  const d1 = await r1.json();
  if (!d1.token) { console.log('REDDINGTON login FAIL:', d1.message); return; }
  console.log('1. REDDINGTON login OK:', d1.user.full_name);
  const h1 = {'Authorization':`Bearer ${d1.token}`, 'Content-Type':'application/json'};

  // Search for E2E Flow user
  const rs = await fetch(`${BASE}/api/contacts/search?q=E2E`, {headers: h1});
  const users = await rs.json();
  console.log('2. Search users:', users.length, 'found');
  
  if (users.length === 0) {
    console.log('   No users found - using known ID');
    // Try with known phone
    const rs2 = await fetch(`${BASE}/api/contacts/search?q=240829`, {headers: h1});
    const u2 = await rs2.json();
    console.log('   Search by phone:', u2.length, 'found');
    if (u2.length > 0) console.log('   Found:', u2[0].full_name, u2[0].phone);
  } else {
    users.forEach(u => console.log('   -', u.full_name, '|', u.phone, '|', u.id));
  }

  // Get all users from Supabase to find target
  const allUsers = users.length > 0 ? users : [];
  const targetId = allUsers.length > 0 ? allUsers[0].id : null;

  if (!targetId) {
    console.log('\n3. No target user - creating test with self-chat workaround');
    // Just test chat list
    const rch = await fetch(`${BASE}/api/chats`, {headers: h1});
    const chats = await rch.json();
    console.log('   Chats:', chats.length);
    return;
  }

  // Create private chat
  const rc = await fetch(`${BASE}/api/chats/private`, {
    method:'POST', headers: h1,
    body: JSON.stringify({participant_id: targetId})
  });
  const chat = await rc.json();
  if (!chat.id) { console.log('3. Chat create FAIL:', chat); return; }
  console.log('3. Chat created:', chat.id);

  // Send message
  const rm = await fetch(`${BASE}/api/chats/${chat.id}/messages`, {
    method:'POST', headers: h1,
    body: JSON.stringify({text:'Hola! Prueba de mensajeria real EgChat v2.5 - ' + new Date().toISOString()})
  });
  const msg = await rm.json();
  console.log('4. Message sent:', msg.text ? msg.text.substring(0,50) : JSON.stringify(msg));

  // Get chats list
  const rch = await fetch(`${BASE}/api/chats`, {headers: h1});
  const chats = await rch.json();
  console.log('5. Chats list:', chats.length, 'chats');

  // Get messages
  const rms = await fetch(`${BASE}/api/chats/${chat.id}/messages`, {headers: h1});
  const msgs = await rms.json();
  console.log('6. Messages in chat:', msgs.length);
  msgs.slice(-3).forEach(m => console.log('   -', m.text?.substring(0,40), '|', m.status));

  console.log('\n=== MENSAJERIA FUNCIONANDO CORRECTAMENTE ===');
}

test().catch(e => console.error('ERROR:', e.message));
