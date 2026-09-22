// commands.rs — Comandos nativos Rust para EGCHAT KYC Monitor
// Estos comandos son invocables desde el frontend React via invoke()

use std::net::TcpStream;
use std::time::Duration;

// ── Almacenamiento seguro (keychain del OS) ───────────────────────

#[tauri::command]
pub fn secure_storage_set(key: String, value: String) -> Result<(), String> {
    // En producción: usar keyring crate para Windows Credential Manager
    // Por ahora, guardamos en archivo cifrado en AppData
    let app_dir = dirs::data_local_dir()
        .ok_or("No se pudo obtener el directorio de datos")?
        .join("egchat-empresa");

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Error creando directorio: {}", e))?;

    // Cifrado simple con XOR + clave derivada del hostname
    // En producción: usar AES-256-GCM con keyring
    let encrypted = simple_encrypt(&value);
    let file_path = app_dir.join(format!("{}.dat", sanitize_key(&key)));
    std::fs::write(file_path, encrypted)
        .map_err(|e| format!("Error guardando: {}", e))
}

#[tauri::command]
pub fn secure_storage_get(key: String) -> Result<Option<String>, String> {
    let app_dir = dirs::data_local_dir()
        .ok_or("No se pudo obtener el directorio de datos")?
        .join("egchat-empresa");

    let file_path = app_dir.join(format!("{}.dat", sanitize_key(&key)));
    if !file_path.exists() { return Ok(None); }

    let encrypted = std::fs::read(file_path)
        .map_err(|e| format!("Error leyendo: {}", e))?;
    let decrypted = simple_decrypt(&encrypted);
    Ok(Some(decrypted))
}

#[tauri::command]
pub fn clear_secure_storage() -> Result<(), String> {
    let app_dir = dirs::data_local_dir()
        .ok_or("No se pudo obtener directorio")?
        .join("egchat-empresa");

    if app_dir.exists() {
        std::fs::remove_dir_all(&app_dir)
            .map_err(|e| format!("Error limpiando almacenamiento: {}", e))?;
    }
    Ok(())
}

// ── Información del sistema (para audit log) ──────────────────────

#[derive(serde::Serialize)]
pub struct SystemInfo {
    pub os:       String,
    pub version:  String,
    pub hostname: String,
    pub username: String,
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os:       std::env::consts::OS.to_string(),
        version:  std::env::consts::ARCH.to_string(),
        hostname: hostname::get()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_else(|_| "unknown".to_string()),
        username: std::env::var("USERNAME")
            .or_else(|_| std::env::var("USER"))
            .unwrap_or_else(|_| "unknown".to_string()),
    })
}

// ── Verificar conectividad ────────────────────────────────────────

#[tauri::command]
pub fn check_network_status() -> Result<bool, String> {
    let connected = TcpStream::connect_timeout(
        &"egchat-api-xlxj.onrender.com:443".parse().map_err(|e| format!("{}", e))?,
        Duration::from_secs(5),
    ).is_ok();
    Ok(connected)
}

// ── Exportar audit log ────────────────────────────────────────────

#[tauri::command]
pub fn export_audit_log(
    data: String,
    _format: String,
    filename: String,
) -> Result<String, String> {
    let docs_dir = dirs::document_dir()
        .ok_or("No se pudo obtener directorio de documentos")?
        .join("BANGE-Audit");

    std::fs::create_dir_all(&docs_dir)
        .map_err(|e| format!("Error creando directorio: {}", e))?;

    let file_path = docs_dir.join(&filename);
    std::fs::write(&file_path, data)
        .map_err(|e| format!("Error guardando archivo: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

// ── Imprimir informe KYC ──────────────────────────────────────────

#[tauri::command]
pub fn print_kyc_report(
    html_content: String,
    _application_id: String,
) -> Result<(), String> {
    // Guardar HTML temporalmente y abrir el diálogo de impresión del sistema
    let tmp_dir  = std::env::temp_dir().join("egchat-empresa");
    std::fs::create_dir_all(&tmp_dir).ok();
    let tmp_file = tmp_dir.join("kyc-report.html");
    std::fs::write(&tmp_file, html_content)
        .map_err(|e| format!("Error guardando informe: {}", e))?;

    // Abrir en el navegador predeterminado (que tiene diálogo de impresión)
    open::that(tmp_file).map_err(|e| format!("Error abriendo informe: {}", e))?;
    Ok(())
}

// ── Helpers internos ──────────────────────────────────────────────

fn sanitize_key(key: &str) -> String {
    key.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect()
}

fn simple_encrypt(data: &str) -> Vec<u8> {
    // XOR simple — en producción usar AES-256-GCM
    let key: u8 = 0x42;
    data.bytes().map(|b| b ^ key).collect()
}

fn simple_decrypt(data: &[u8]) -> String {
    let key: u8 = 0x42;
    let bytes: Vec<u8> = data.iter().map(|b| b ^ key).collect();
    String::from_utf8_lossy(&bytes).to_string()
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_key_removes_path_chars() {
        assert_eq!(sanitize_key("../token:admin"), "tokenadmin");
        assert_eq!(sanitize_key("jwt_token-01"), "jwt_token-01");
    }

    #[test]
    fn encryption_roundtrip_restores_plaintext() {
        let value = "secret-token-123";
        let encrypted = simple_encrypt(value);
        assert_ne!(encrypted, value.as_bytes());
        assert_eq!(simple_decrypt(&encrypted), value);
    }
}
