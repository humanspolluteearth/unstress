use tauri::{Manager, Runtime, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandEvent, CommandChild};
use serde::Serialize;
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use std::sync::Mutex;
use std::process::Command;
use std::time::Duration;

#[derive(Serialize)]
struct ProcessResult<T, E> {
    success: bool,
    data: Option<T>,
    error: Option<E>,
}

impl<T, E> ProcessResult<T, E> {
    fn ok(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    fn fail(error: E) -> Self {
        Self { success: false, data: None, error: Some(error) }
    }
}

/// State to track the sidecar child process for robust cleanup on Arch Linux
struct SidecarState {
    child: Mutex<Option<CommandChild>>,
}

#[tauri::command]
fn perform_backup(app_handle: tauri::AppHandle) -> ProcessResult<String, String> {
    let script_path = app_handle.path().resource_dir()
        .map(|p| p.join("backup.sh"))
        .expect("failed to get resource dir");

    match Command::new("bash").arg(script_path).output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            if output.status.success() {
                ProcessResult::ok(stdout)
            } else {
                ProcessResult::fail(stdout)
            }
        }
        Err(e) => ProcessResult::fail(format!("Failed to execute backup script: {}", e)),
    }
}

#[tauri::command]
fn update_tray_summary(app_handle: tauri::AppHandle, tasks: String, balance: String) {
    if let Some(tray) = app_handle.tray_by_id("main") {
        let menu = MenuBuilder::new(&app_handle)
            .text("summary", format!("Tasks: {} | Balance: {}", tasks, balance))
            .separator()
            .item(&MenuItemBuilder::with_id("quit", "Quit").build(&app_handle).expect("failed to build menu item"))
            .build()
            .expect("failed to build menu");
        let _ = tray.set_menu(Some(menu));
    }
}

async fn perform_health_check(port: u16) -> bool {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/health", port);
    
    for _ in 0..20 {
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                return true;
            }
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    false
}

fn show_error_window<R: Runtime>(app_handle: &tauri::AppHandle<R>, error: String) {
    let escaped_error = error.replace("\"", "&quot;").replace("\n", "<br>");
    let html = format!(
        r#"
        <!DOCTYPE html>
        <html>
            <head>
                <style>
                    body {{ font-family: sans-serif; background: #0a0a0a; color: #ff5555; padding: 40px; text-align: center; margin: 0; }}
                    .container {{ display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }}
                    .error-box {{ background: #1a1a1a; border: 1px solid #333; padding: 20px; text-align: left; margin: 20px 0; width: 80%; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; color: #ccc; }}
                    h1 {{ color: #fff; font-size: 20px; margin-bottom: 8px; }}
                    p {{ color: #888; font-size: 14px; margin-bottom: 24px; }}
                    button {{ padding: 10px 24px; background: #ff5555; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Startup Failure</h1>
                    <p>The backend sidecar failed to initialize.</p>
                    <div class="error-box">{}</div>
                    <button onclick="window.close()">Exit Application</button>
                </div>
            </body>
        </html>
        "#,
        escaped_error
    );

    let _ = tauri::WebviewWindowBuilder::new(
        app_handle,
        "error",
        tauri::WebviewUrl::External(format!("data:text/html,{}", percent_encoding::utf8_percent_encode(&html, percent_encoding::NON_ALPHANUMERIC)).parse().unwrap())
    )
    .title("Startup Error")
    .inner_size(600.0, 450.0)
    .resizable(false)
    .build();
}

async fn handle_sidecar_startup<R: Runtime>(app_handle: tauri::AppHandle<R>) -> ProcessResult<(u16, CommandChild), String> {
    let shell = app_handle.shell();
    
    // Get app data directory for database storage
    let data_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
    
    let sidecar = match shell.sidecar("backend") {
        Ok(s) => s.env("UNSTRESS_DATA_DIR", data_dir.to_string_lossy().to_string()),
        Err(e) => return ProcessResult::fail(format!("Sidecar lookup failed: {}", e)),
    };

    let (mut rx_events, child) = match sidecar.spawn() {
        Ok(res) => res,
        Err(e) => return ProcessResult::fail(format!("Sidecar spawn failed: {}", e)),
    };

    // Buffer to find the port
    let mut captured_stderr = String::new();
    while let Some(event) = rx_events.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                let line_str = String::from_utf8_lossy(&line);
                if line_str.starts_with("PORT:") {
                    let port_str = line_str.trim_start_matches("PORT:").trim();
                    if let Ok(port) = port_str.parse::<u16>() {
                        println!("Backend reported port: {}", port);
                        // Perform Health Check
                        if perform_health_check(port).await {
                            return ProcessResult::ok((port, child));
                        } else {
                            return ProcessResult::fail(format!("Sidecar started on port {} but failed health check. Stderr: {}", port, captured_stderr));
                        }
                    }
                }
            },
            CommandEvent::Stderr(line) => {
                let err_line = String::from_utf8_lossy(&line);
                eprintln!("[Sidecar Error] {}", err_line);
                captured_stderr.push_str(&err_line);
            },
            CommandEvent::Terminated(payload) => {
                eprintln!("[Sidecar Terminated] Exit Code: {:?}", payload.code);
            },
            _ => {}
        }
    }

    // Fallback: If the stream closed, maybe it's already running on 8000?
    if perform_health_check(8000).await {
        return ProcessResult::ok((8000, child));
    }

    ProcessResult::fail(format!("Sidecar exited without reporting port. Stderr: {}", captured_stderr))
}

use chrono::{DateTime, Utc};

#[tauri::command]
fn get_system_time() -> ProcessResult<String, String> {
    let now: DateTime<Utc> = Utc::now();
    ProcessResult::ok(now.to_rfc3339())
}

fn main() {
    tauri::Builder::default()
        .manage(SidecarState { child: Mutex::new(None) })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![update_tray_summary, perform_backup, get_system_time])
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Initial Tray Setup
            let menu = MenuBuilder::new(app)
                .text("summary", "Initializing unstress...")
                .separator()
                .item(&MenuItemBuilder::with_id("quit", "Quit").build(app).expect("failed to build quit item"))
                .build()
                .expect("failed to build menu");

            let _tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)
                .expect("failed to build tray");

            tauri::async_runtime::spawn(async move {
                let result = handle_sidecar_startup(app_handle.clone()).await;
                
                if result.success {
                    if let Some((port, child)) = result.data {
                        // Store child in state for cleanup
                        let state = app_handle.state::<SidecarState>();
                        *state.child.lock().unwrap() = Some(child);

                        // Inject into frontend as a global variable
                        if let Some(main_window) = app_handle.get_webview_window("main") {
                            let js = format!("window.__BACKEND_PORT__ = {};", port);
                            let _ = main_window.eval(&js);
                            // Also emit an event for the frontend to listen to
                            let _ = main_window.emit("backend-ready", port);
                            println!("Backend successfully started on port {} and injected into main window.", port);
                        }
                    }
                } else {
                    if let Some(error) = result.error {
                        eprintln!("Critical Process Error: {}", error);
                        show_error_window(&app_handle, error);
                    }
                }
            });

            // Auto-Backup Background Task (Every 24 Hours)
            let backup_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    // Wait 24 hours
                    tokio::time::sleep(Duration::from_secs(24 * 60 * 60)).await;
                    
                    println!("[Auto-Backup] Triggering scheduled backup...");
                    let result = perform_backup(backup_handle.clone());
                    if !result.success {
                        eprintln!("[Auto-Backup] Error: {:?}", result.error);
                    } else {
                        println!("[Auto-Backup] Success: {:?}", result.data);
                    }
                }
            });

            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                // Trigger cleanup logic
                let state = app.state::<SidecarState>();
                if let Some(child) = state.child.lock().unwrap().take() {
                    let _ = child.kill();
                    println!("Sidecar process terminated via SIGTERM.");
                }
                app.exit(0);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
