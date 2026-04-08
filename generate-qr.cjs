const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// URLs para generar QR codes
const urls = {
  frontend: 'http://localhost:3001',
  backend: 'http://localhost:5000',
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
            color: #00c8A0;
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

// Generar QR principal
async function generateMainQR() {
  console.log('🎯 Generando QR Principal para EGCHAT...\n');
  
  await generateQRCode(
    urls.frontend, 
    'EGCHAT-Principal', 
    'EGCHAT - Aplicación Web Principal'
  );
  
  console.log('\n🚀 ¡QR generado exitosamente!');
  console.log('\n📋 Para usar:');
  console.log('  1. Abre EGCHAT-Principal.html en tu navegador');
  console.log('  2. Escanea el QR con tu teléfono móvil');
  console.log('  3. Accede instantáneamente a EGCHAT');
  console.log('\n🌐 URL directa: ' + urls.frontend);
}

// Ejecutar
generateMainQR();
