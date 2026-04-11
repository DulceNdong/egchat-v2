#!/usr/bin/env node

/**
 * Script para consultar usuarios en Supabase
 * Uso: node query-users.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dpkfwlzikmdvhqxhyfmz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwa2Z3bHppa21kdmhxeGh5Zm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2ODAwMDAsImV4cCI6MTk5OTAwMDAwMH0.test_key';

console.log('🔍 Consultando usuarios en EGCHAT...\n');

async function getUsers() {
  try {
    // Usar la API REST de Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`⚠️  Status: ${response.status}`);
      const error = await response.text();
      console.log('Error:', error);
      
      // Si falla, intenta conexión local
      console.log('\n📌 Para ver usuarios, accede a:');
      console.log('   Supabase Dashboard: https://supabase.com/');
      console.log('   Project: dpkfwlzikmdvhqxhyfmz');
      return;
    }

    const users = await response.json();

    if (users.length === 0) {
      console.log('❌ No hay usuarios registrados aún');
      console.log('   Los usuarios aparecerán cuando se registren en la app');
      return;
    }

    console.log(`✅ Total de usuarios: ${users.length}\n`);
    console.log('📋 Lista de usuarios:\n');
    console.log('┌─────┬──────────────────┬──────────────────────┬────────────┐');
    console.log('│ # │ Teléfono │ Nombre │ Fecha Registro │');
    console.log('├─────┼──────────────────┼──────────────────────┼────────────┤');
    
    users.forEach((user, index) => {
      const phone = user.phone || 'N/A';
      const name = user.full_name || 'Sin nombre';
      const date = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
      const avatar = user.avatar_url ? '📸' : '  ';
      
      console.log(`│ ${String(index + 1).padStart(3)} │ ${phone.padEnd(16)} │ ${name.padEnd(20)} │ ${date} │`);
    });
    
    console.log('└─────┴──────────────────┴──────────────────────┴────────────┘\n');

    // Estadísticas
    const usersWithAvatar = users.filter(u => u.avatar_url).length;
    const usersActive = users.filter(u => u.is_active).length;

    console.log('📊 Estadísticas:');
    console.log(`   • Total registrados: ${users.length}`);
    console.log(`   • Con foto de perfil: ${usersWithAvatar}`);
    console.log(`   • Usuarios activos: ${usersActive}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica tu conexión a internet');
    console.log('   2. Revisa las credenciales de Supabase en .env');
    console.log('   3. Accede a Supabase Dashboard manualmente: https://supabase.com');
  }
}

getUsers();