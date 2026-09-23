#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::secure_storage_set,
            commands::secure_storage_get,
            commands::clear_secure_storage,
            commands::get_system_info,
            commands::export_audit_log,
            commands::check_network_status,
            commands::print_kyc_report,
        ])
        .run(tauri::generate_context!())
        .expect("error al iniciar EGCHAT KYC Monitor");
}
