// Script de debug para probar login desde la consola del navegador
// Copia y pega esto en la consola del navegador (F12 > Console)

const debugLogin = async (phone, password) => {
  console.log('🔍 Probando login con:', { phone, password });

  try {
    const response = await fetch('https://egchat-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, password })
    });

    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📦 Response:', data);

    if (response.ok) {
      console.log('✅ Login exitoso!');
      return data;
    } else {
      console.log('❌ Error en login:', data.message || 'Error desconocido');
      return null;
    }
  } catch (error) {
    console.error('💥 Error de red:', error);
    return null;
  }
};

// Ejemplo de uso:
// debugLogin('+240123456789', 'tu_password_aqui');

// Para probar conectividad básica:
// fetch('https://egchat-api.onrender.com/api/health').then(r => r.json()).then(d => console.log('Health:', d)).catch(e => console.error('Health error:', e));