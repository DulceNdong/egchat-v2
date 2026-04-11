// Script de prueba para verificar conectividad del backend
const testBackend = async () => {
  try {
    console.log('🔍 Probando conectividad del backend...');

    // Test health endpoint
    const healthResponse = await fetch('https://egchat-api.onrender.com/api/health');
    console.log('Health status:', healthResponse.status);

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend responde:', healthData);
    } else {
      console.log('❌ Backend no responde correctamente');
    }

    // Test login endpoint (sin credenciales reales)
    console.log('🔍 Probando endpoint de login...');
    const loginResponse = await fetch('https://egchat-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+240123456789', password: 'test' })
    });

    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

  } catch (error) {
    console.error('❌ Error de conectividad:', error);
  }
};

testBackend();