const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// URLs para generar QR codes
const urls = {
  frontend: 'https://egchat-gq.com',
  backend: 'https://api.egchat-gq.com',
  github: 'https://github.com/tu-usuario/egchat-backup',
  download: 'https://egchat-gq.com/download'
};

async function generateQRCode(text, filename, description) {
  try {
    // Generar QR code con opciones personalizadas
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0d1117',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    // Crear HTML con el QR code
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EGCHAT - ${description}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0d1117 0%, #1e293b 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            margin: 20px;
        }
        .logo {
            font-size: 48px;
            font-weight: 900;
            color: #facc15;
            margin-bottom: 20px;
            text-shadow: 0 4px 8px rgba(250, 204, 21, 0.3);
        }
        .title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
            color: #00c8a0;
        }
        .description {
            font-size: 16px;
            margin-bottom: 30px;
            opacity: 0.8;
            line-height: 1.5;
        }
        .qr-container {
            background: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .qr-image {
            width: 100%;
            max-width: 300px;
            height: auto;
        }
        .url {
            background: rgba(250, 204, 21, 0.2);
            border: 1px solid rgba(250, 204, 21, 0.4);
            border-radius: 10px;
            padding: 12px 16px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 20px 0;
            word-break: break-all;
        }
        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .btn {
            background: linear-gradient(135deg, #00c8a0, #00b4e6);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 200, 160, 0.3);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .footer {
            margin-top: 40px;
            font-size: 12px;
            opacity: 0.6;
        }
        @media (max-width: 480px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            .logo {
                font-size: 36px;
            }
            .title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🇬🇶 EGCHAT</div>
        <h1 class="title">${description}</h1>
        <p class="description">
            Escanea este código QR para acceder directamente a EGCHAT desde tu dispositivo móvil.
        </p>
        <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" class="qr-image">
        </div>
        <div class="url">${text}</div>
        <div class="buttons">
            <a href="${text}" target="_blank" class="btn">Abrir App</a>
            <button onclick="window.print()" class="btn btn-secondary">Imprimir QR</button>
        </div>
        <div class="footer">
            EGCHAT - Conectando Guinea Ecuatorial<br>
            📱 PWA • 🌐 Web • 🖥️ Desktop
        </div>
    </div>
</body>
</html>`;

    // Guardar archivo HTML
    const filePath = path.join(__dirname, `${filename}.html`);
    fs.writeFileSync(filePath, html);
    
    console.log(`✅ QR generado: ${filename}.html`);
    console.log(`📱 URL: ${text}`);
    console.log(`📁 Archivo: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error(`❌ Error generando QR para ${filename}:`, error);
  }
}

// Generar todos los QR codes
async function generateAllQRCodes() {
  console.log('🚀 Generando Códigos QR para EGCHAT...\n');
  
  await generateQRCode(
    urls.frontend, 
    'egchat-frontend', 
    'EGCHAT - Aplicación Web'
  );
  
  await generateQRCode(
    urls.backend, 
    'egchat-backend', 
    'EGCHAT - API Backend'
  );
  
  await generateQRCode(
    urls.github, 
    'egchat-github', 
    'EGCHAT - Código Fuente'
  );
  
  await generateQRCode(
    urls.download, 
    'egchat-download', 
    'EGCHAT - Descargar App'
  );
  
  console.log('\n🎉 ¡Todos los QR codes generados!');
  console.log('\n📋 Archivos creados:');
  console.log('  • egchat-frontend.html - QR para la app principal');
  console.log('  • egchat-backend.html - QR para el API');
  console.log('  • egchat-github.html - QR para el código');
  console.log('  • egchat-download.html - QR para descargas');
  console.log('\n🌐 Para usar:');
  console.log('  1. Abre cualquiera de los archivos .html en tu navegador');
  console.log('  2. Escanea el QR con tu teléfono móvil');
  console.log('  3. Accede instantáneamente a EGCHAT');
}

// Generar QR principal combinado
async function generateMasterQR() {
  console.log('🎯 Generando QR Master con todas las opciones...\n');
  
  const masterHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EGCHAT - Centro de Descargas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0d1117 0%, #1e293b 100%);
            min-height: 100vh;
            color: white;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            font-size: 64px;
            font-weight: 900;
            color: #facc15;
            text-shadow: 0 4px 8px rgba(250, 204, 21, 0.3);
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 18px;
            opacity: 0.8;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 15px;
            color: #00c8a0;
        }
        .card-description {
            margin-bottom: 20px;
            opacity: 0.8;
            line-height: 1.5;
        }
        .btn {
            background: linear-gradient(135deg, #00c8a0, #00b4e6);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            margin: 5px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 200, 160, 0.3);
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 0.6;
            font-size: 14px;
        }
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🇬🇶 EGCHAT</div>
        <div class="subtitle">Centro de Acceso Rápido</div>
    </div>
    
    <div class="grid">
        <div class="card">
            <div class="card-title">📱 Aplicación Principal</div>
            <div class="card-description">
                Accede a EGCHAT Web App con todas las funciones: chat, wallet, taxi, servicios y más.
            </div>
            <a href="${urls.frontend}" target="_blank" class="btn">Abrir EGCHAT</a>
        </div>
        
        <div class="card">
            <div class="card-title">🔧 Backend API</div>
            <div class="card-description">
                Documentación y acceso a la API para desarrolladores.
            </div>
            <a href="${urls.backend}/health" target="_blank" class="btn">Ver API Status</a>
        </div>
        
        <div class="card">
            <div class="card-title">💻 Código Fuente</div>
            <div class="card-description">
                Accede al código completo del proyecto en GitHub.
            </div>
            <a href="${urls.github}" target="_blank" class="btn">Ver en GitHub</a>
        </div>
        
        <div class="card">
            <div class="card-title">📥 Descargar</div>
            <div class="card-description">
                Descarga versiones offline y archivos de instalación.
            </div>
            <a href="${urls.download}" target="_blank" class="btn">Descargar App</a>
        </div>
    </div>
    
    <div class="footer">
        <p>🇬🇶 <strong>EGCHAT</strong> - Conectando Guinea Ecuatorial</p>
        <p>📱 PWA • 🌐 Web • 🖥️ Desktop • 🚀 Rápido y Seguro</p>
        <p>Escanea cualquier QR o haz clic en los enlaces para acceder</p>
    </div>
</body>
</html>`;

  fs.writeFileSync(path.join(__dirname, 'EGCHAT-MASTER.html'), masterHtml);
  console.log('✅ QR Master generado: EGCHAT-MASTER.html');
  console.log('🎯 Este archivo contiene acceso a todo el proyecto');
}

// Ejecutar
generateAllQRCodes().then(() => {
  generateMasterQR();
  console.log('\n🚀 ¡Proceso completado! Abre los archivos HTML para ver los QR codes.');
});
