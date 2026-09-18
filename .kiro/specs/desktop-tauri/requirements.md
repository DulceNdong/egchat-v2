# Spec 8: Apps de Escritorio con Tauri 2.0

## Contexto
Dos apps de escritorio para los paneles de administración KYC:
- **BANGE KYC Admin** — para analistas y compliance officers de BANGE
- **EGCHAT KYC Monitor** — para el equipo interno de Tu Empresa

Windows es la prioridad (95% de equipos en Guinea Ecuatorial).

## Stack
- **Frontend**: React + Vite + Tailwind CSS (reutiliza el dashboard web)
- **Desktop wrapper**: Tauri 2.0 (Rust)
- **Instaladores**: MSI + NSIS (Windows), DMG (macOS), AppImage (Linux)

## Apps

| App | Identificador | Usuarios |
|-----|--------------|----------|
| BANGE KYC Admin | com.egchat.bange.kyc | Analistas BANGE |
| EGCHAT KYC Monitor | com.egchat.empresa.kyc | Equipo interno |

## Seguridad específica de escritorio

- JWT almacenado en Windows Credential Manager / macOS Keychain (nunca localStorage)
- CSP: solo permite conexiones a `egchat-api-xlxj.onrender.com`
- Auto-lock por inactividad: 15 minutos
- Binarios firmados con certificado EV Code Signing
- Verificación de integridad SHA-256 al iniciar

## Comandos nativos (Rust → JavaScript)

```rust
secure_storage_set(key, value)   // JWT en keychain OS
secure_storage_get(key)          // Recuperar JWT
clear_secure_storage()           // Logout: limpiar keychain
get_system_info()                // hostname, MAC → audit log
export_audit_log(start, end, fmt) // CSV/PDF → ~/Documents/
print_kyc_report(app_id, fmt)    // Imprimir informe
check_network_status()           // Ping al backend
```

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| Ctrl+N | Siguiente caso pendiente |
| Ctrl+A | Aprobar caso actual |
| Ctrl+R | Rechazar caso actual |
| Ctrl+F | Buscar |
| Ctrl+P | Imprimir informe |
| F5 | Refrescar cola |

## Distribución

- Windows: servidor interno de la empresa (URL de descarga directa)
- BANGE: despliegue vía GPO (Group Policy) en toda la red bancaria
- Actualizaciones: automáticas via `tauri-plugin-updater`
