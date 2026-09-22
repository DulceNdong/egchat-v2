# Tareas: Apps de Escritorio con Tauri

## Prerrequisitos
- [ ] **T-00** Instalar Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- [ ] **T-00b** Instalar Tauri CLI: `npm install -g @tauri-apps/cli`

## Fase 1 — Estructura base
- [x] **T-01** Crear `apps/dashboard-bange/` — React + Vite + Tailwind (panel BANGE)
- [x] **T-02** Crear `apps/dashboard-empresa/` — React + Vite + Tailwind (panel Tu Empresa)
- [x] **T-03** Crear `apps/desktop-bange/` — wrapper Tauri para BANGE
- [x] **T-04** Crear `apps/desktop-empresa/` — wrapper Tauri para Tu Empresa
- [x] **T-05** Configurar `tauri.conf.json` para cada app con CSP estricta

## Fase 2 — Comandos nativos Rust
- [x] **T-06** `secure_storage_set/get/clear` — JWT en keychain del OS
- [x] **T-07** `get_system_info` — OS, hostname, MAC (para audit log)
- [x] **T-08** `export_audit_log` — exportar a CSV/PDF en ~/Documents/
- [x] **T-09** `print_kyc_report` — imprimir informe del caso
- [x] **T-10** `check_network_status` — verificar conectividad backend

## Fase 3 — Funcionalidades nativas
- [x] **T-11** Auto-lock por inactividad (15 min) — React + comando Tauri
- [x] **T-12** Notificaciones nativas con `tauri-plugin-notification`
- [x] **T-13** Atajos de teclado: Ctrl+N, Ctrl+A, Ctrl+R, Ctrl+F, Ctrl+P, F5
- [ ] **T-14** Bandeja del sistema con contador de casos pendientes
- [x] **T-15** Auto-actualización con `tauri-plugin-updater`
- [ ] **T-16** Modo offline: caché local cifrado + sincronización al reconectar

## Fase 4 — Build y distribución
- [ ] **T-17** Build Windows: `npm run tauri build -- --target x86_64-pc-windows-msvc`
- [ ] **T-18** Build macOS: `npm run tauri build -- --target aarch64-apple-darwin`
- [ ] **T-19** Configurar code signing (certificado EV Windows + Apple Developer ID)
- [x] **T-20** Script de despliegue GPO para BANGE (PowerShell)
- [x] **T-21** Documentación de instalación para IT de BANGE

## Fase 5 — Tests
- [x] **T-22** Tests unitarios Rust (`#[cfg(test)]`) para comandos nativos
- [x] **T-23** Test de seguridad: CSP bloquea conexiones externas
- [x] **T-24** Test de auto-lock: verificar que bloquea a los 15 min
